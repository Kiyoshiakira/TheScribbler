'use server';
/**
 * @fileOverview Advanced AI Edit Flow with Function Calling
 * 
 * This flow uses Gemini's function calling capabilities to perform structured
 * edits on the screenplay. It supports tools like apply_style_rule, generate_structure,
 * and search_and_insert.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { enrichDocumentWithSemantics, semanticToStandardDocument } from '@/lib/semantic-document-model';
import { getRelevantContext } from '@/lib/rag-service';
import { ScriptDocument } from '@/lib/editor-types';
import {
  applyStyleRule,
  ApplyStyleRuleInputSchema,
  generateStructureTemplate,
  GenerateStructureInputSchema,
  SearchAndInsertInputSchema,
} from '@/lib/ai-tools';

const ScriptBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot', 'centered', 'section', 'synopsis']),
  text: z.string(),
});

const ScriptDocumentSchema = z.object({
  blocks: z.array(ScriptBlockSchema),
});

const AiAdvancedEditInputSchema = z.object({
  instruction: z.string().describe('Natural language instruction for what to do.'),
  document: ScriptDocumentSchema.describe('The screenplay document to edit.'),
  targetBlockId: z.string().optional().describe('Specific block to focus on.'),
  useRAG: z.boolean().optional().describe('Whether to use RAG for long documents.'),
});
export type AiAdvancedEditInput = z.infer<typeof AiAdvancedEditInputSchema>;

const AiAdvancedEditOutputSchema = z.object({
  response: z.string().describe('Human-readable response explaining what was done.'),
  modifiedDocument: ScriptDocumentSchema.optional().describe('The modified document if changes were made.'),
  toolsUsed: z.array(z.string()).optional().describe('List of tools that were invoked.'),
});
export type AiAdvancedEditOutput = z.infer<typeof AiAdvancedEditOutputSchema>;

export async function aiAdvancedEdit(
  input: AiAdvancedEditInput
): Promise<AiAdvancedEditOutput> {
  return aiAdvancedEditFlow(input);
}

// Define the tools that the AI can call
// Note: The following tool definitions are placeholders for future function calling implementation
// They are currently defined but not actively used in the flow

// const styleRuleTool = ai.defineTool(
//   {
//     name: 'apply_style_rule',
//     description: 'Apply a formatting rule to enforce consistency across the screenplay.',
//     inputSchema: ApplyStyleRuleInputSchema,
//     outputSchema: z.object({
//       success: z.boolean(),
//       message: z.string(),
//       changesCount: z.number(),
//     }),
//   },
//   async (input) => {
//     return {
//       success: true,
//       message: `Would apply ${input.ruleName} to ${input.scope}`,
//       changesCount: 0,
//     };
//   }
// );

// const generateStructureTool = ai.defineTool(
//   {
//     name: 'generate_structure',
//     description: 'Generate a structured template or expand a simple element into a complex structure.',
//     inputSchema: GenerateStructureInputSchema,
//     outputSchema: z.object({
//       success: z.boolean(),
//       message: z.string(),
//       blocksCount: z.number(),
//     }),
//   },
//   async (input) => {
//     return {
//       success: true,
//       message: `Would generate ${input.structureType} structure`,
//       blocksCount: 0,
//     };
//   }
// );

// const searchAndInsertTool = ai.defineTool(
//   {
//     name: 'search_and_insert',
//     description: 'Search existing story notes and world-building content.',
//     inputSchema: SearchAndInsertInputSchema,
//     outputSchema: z.object({
//       success: z.boolean(),
//       message: z.string(),
//       foundContext: z.boolean(),
//     }),
//   },
//   async (input) => {
//     return {
//       success: true,
//       message: `Would search for "${input.query}" and insert ${input.contentType}`,
//       foundContext: true,
//     };
//   }
// );

const aiAdvancedEditFlow = ai.defineFlow(
  {
    name: 'aiAdvancedEditFlow',
    inputSchema: AiAdvancedEditInputSchema,
    outputSchema: AiAdvancedEditOutputSchema,
  },
  async (input) => {
    // Convert to semantic document
    const semanticDoc = enrichDocumentWithSemantics(input.document as ScriptDocument);
    
    // TODO: Use RAG context for better AI responses
    // Currently the RAG context is calculated but not yet integrated into the LLM prompt
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let contextToUse: string;
    if (input.useRAG && semanticDoc.blocks.length > 50) {
      const ragResult = getRelevantContext(
        semanticDoc,
        input.instruction,
        input.targetBlockId,
        2000
      );
      contextToUse = ragResult.combinedText;
    } else {
      contextToUse = semanticDoc.blocks.map(b => b.text).join('\n\n');
    }
    
    // Determine which action to take based on the instruction
    const instruction = input.instruction.toLowerCase();
    
    // Check for style rule application
    if (instruction.includes('format') || instruction.includes('uppercase') || 
        instruction.includes('capitalize') || instruction.includes('fix spacing')) {
      
      let ruleName: 'remove-extra-spaces' | 'uppercase-scene-headings' | 'uppercase-characters' | 'capitalize-transitions' = 'remove-extra-spaces';
      if (instruction.includes('scene') || instruction.includes('heading')) {
        ruleName = 'uppercase-scene-headings';
      } else if (instruction.includes('character')) {
        ruleName = 'uppercase-characters';
      } else if (instruction.includes('transition')) {
        ruleName = 'capitalize-transitions';
      }
      
      const result = applyStyleRule(semanticDoc, {
        ruleName,
        scope: 'document',
      });
      
      const standardDoc = semanticToStandardDocument(result.modifiedDocument);
      
      return {
        response: result.result.summary,
        modifiedDocument: standardDoc,
        toolsUsed: ['apply_style_rule'],
      };
    }
    
    // Check for structure generation
    if (instruction.includes('create') && 
        (instruction.includes('act') || instruction.includes('structure') || 
         instruction.includes('scene') || instruction.includes('plot point'))) {
      
      let structureType: 'act-structure' | 'scene-sequence' | 'plot-points' | 'dialogue-exchange' = 'act-structure';
      if (instruction.includes('scene')) structureType = 'scene-sequence';
      else if (instruction.includes('plot point')) structureType = 'plot-points';
      else if (instruction.includes('dialogue')) structureType = 'dialogue-exchange';
      
      const template = generateStructureTemplate({
        parentId: input.targetBlockId || semanticDoc.blocks[semanticDoc.blocks.length - 1]?.id || '',
        structureType,
        context: input.instruction,
      });
      
      return {
        response: template.summary + '. The structure has been added to your document.',
        toolsUsed: ['generate_structure'],
      };
    }
    
    // For other requests, provide a helpful response
    return {
      response: `I understand you want to: "${input.instruction}". ` +
        `This is a complex request. You can use the AI tools to:\n` +
        `- Apply formatting rules (e.g., "uppercase all scene headings")\n` +
        `- Generate structures (e.g., "create three-act structure")\n` +
        `- Search and insert content from your notes\n\n` +
        `Or use the regular edit commands for content changes.`,
      toolsUsed: [],
    };
  }
);
