/**
 * @fileoverview Function Calling Tools for Gemini AI
 * 
 * This module defines the function calling tools that Gemini can use to perform
 * structured edits on the screenplay. These tools translate natural language
 * requests into reliable, structured operations.
 */

import { z } from 'genkit';
import { SemanticDocument, SemanticBlock } from './semantic-document-model';
import { ScriptBlockType } from './editor-types';

/**
 * Tool: Apply Style Rule
 * Enforces format consistency across the document
 */
export const ApplyStyleRuleInputSchema = z.object({
  blockId: z.string().optional().describe('ID of specific block to apply rule to. If not provided, applies to all matching blocks.'),
  ruleName: z.enum([
    'uppercase-scene-headings',
    'uppercase-characters',
    'capitalize-transitions',
    'remove-extra-spaces',
    'consistent-parentheticals',
    'standard-margins',
    'proper-dialogue-format',
    'scene-numbering',
  ]).describe('The formatting rule to apply.'),
  scope: z.enum(['document', 'scene', 'block', 'selection']).describe('Scope of application: entire document, current scene, specific block, or selection.'),
  sceneNumber: z.number().optional().describe('Scene number when scope is "scene".'),
});

export type ApplyStyleRuleInput = z.infer<typeof ApplyStyleRuleInputSchema>;

export const ApplyStyleRuleOutputSchema = z.object({
  modifiedBlockIds: z.array(z.string()).describe('IDs of blocks that were modified.'),
  changesCount: z.number().describe('Total number of changes made.'),
  summary: z.string().describe('Human-readable summary of changes.'),
});

export type ApplyStyleRuleOutput = z.infer<typeof ApplyStyleRuleOutputSchema>;

/**
 * Implementation of apply_style_rule tool
 */
export function applyStyleRule(
  doc: SemanticDocument,
  input: ApplyStyleRuleInput
): { modifiedDocument: SemanticDocument; result: ApplyStyleRuleOutput } {
  const modifiedBlocks: SemanticBlock[] = [];
  let changesCount = 0;
  
  // Determine which blocks to process
  let blocksToProcess: SemanticBlock[] = [];
  
  if (input.scope === 'block' && input.blockId) {
    const block = doc.blocks.find(b => b.id === input.blockId);
    if (block) blocksToProcess = [block];
  } else if (input.scope === 'scene' && input.sceneNumber) {
    blocksToProcess = doc.blocks.filter(b => b.metadata.sceneNumber === input.sceneNumber);
  } else {
    blocksToProcess = doc.blocks;
  }
  
  // Apply the rule
  blocksToProcess.forEach(block => {
    const modified = applyRuleToBlock(block, input.ruleName);
    if (modified.changed) {
      modifiedBlocks.push(modified.block);
      changesCount++;
    }
  });
  
  // Create modified document
  const newBlocks = doc.blocks.map(b => {
    const modified = modifiedBlocks.find(mb => mb.id === b.id);
    return modified || b;
  });
  
  return {
    modifiedDocument: { ...doc, blocks: newBlocks },
    result: {
      modifiedBlockIds: modifiedBlocks.map(b => b.id),
      changesCount,
      summary: generateStyleRuleSummary(input.ruleName, changesCount),
    },
  };
}

function applyRuleToBlock(
  block: SemanticBlock,
  ruleName: ApplyStyleRuleInput['ruleName']
): { block: SemanticBlock; changed: boolean } {
  let text = block.text;
  let changed = false;
  
  switch (ruleName) {
    case 'uppercase-scene-headings':
      if (block.type === ScriptBlockType.SCENE_HEADING && text !== text.toUpperCase()) {
        text = text.toUpperCase();
        changed = true;
      }
      break;
      
    case 'uppercase-characters':
      if (block.type === ScriptBlockType.CHARACTER && text !== text.toUpperCase()) {
        text = text.toUpperCase();
        changed = true;
      }
      break;
      
    case 'capitalize-transitions':
      if (block.type === ScriptBlockType.TRANSITION && text !== text.toUpperCase()) {
        text = text.toUpperCase();
        changed = true;
      }
      break;
      
    case 'remove-extra-spaces':
      const cleaned = text.replace(/\s+/g, ' ').trim();
      if (cleaned !== text) {
        text = cleaned;
        changed = true;
      }
      break;
      
    case 'consistent-parentheticals':
      if (block.type === ScriptBlockType.PARENTHETICAL) {
        const formatted = text.startsWith('(') && text.endsWith(')') ? text : `(${text.replace(/[()]/g, '').trim()})`;
        if (formatted !== text) {
          text = formatted;
          changed = true;
        }
      }
      break;
  }
  
  return {
    block: changed ? { ...block, text, metadata: { ...block.metadata, updatedAt: Date.now() } } : block,
    changed,
  };
}

function generateStyleRuleSummary(ruleName: ApplyStyleRuleInput['ruleName'], count: number): string {
  const ruleDescriptions: Record<string, string> = {
    'uppercase-scene-headings': 'scene headings to uppercase',
    'uppercase-characters': 'character names to uppercase',
    'capitalize-transitions': 'transitions to uppercase',
    'remove-extra-spaces': 'extra spaces',
    'consistent-parentheticals': 'parentheticals formatting',
    'standard-margins': 'standard margins',
    'proper-dialogue-format': 'dialogue formatting',
    'scene-numbering': 'scene numbers',
  };
  
  return `Applied ${ruleDescriptions[ruleName]} to ${count} block(s).`;
}

/**
 * Tool: Generate Structure
 * Expands a single element into a complex structure
 */
export const GenerateStructureInputSchema = z.object({
  parentId: z.string().describe('ID of the parent block where structure should be inserted.'),
  structureType: z.enum([
    'act-structure',
    'scene-sequence',
    'dialogue-exchange',
    'action-sequence',
    'character-arc',
    'plot-points',
  ]).describe('Type of structure to generate.'),
  context: z.string().describe('Context or description of what to generate.'),
  count: z.number().optional().describe('Number of elements to generate (e.g., number of scenes).'),
});

export type GenerateStructureInput = z.infer<typeof GenerateStructureInputSchema>;

export const GenerateStructureOutputSchema = z.object({
  generatedBlocks: z.array(z.object({
    id: z.string(),
    type: z.string(),
    text: z.string(),
  })).describe('The generated blocks.'),
  summary: z.string().describe('Summary of what was generated.'),
});

export type GenerateStructureOutput = z.infer<typeof GenerateStructureOutputSchema>;

/**
 * Generate structure template based on type
 */
export function generateStructureTemplate(
  input: GenerateStructureInput
): GenerateStructureOutput {
  let generatedBlocks: Array<{ id: string; type: string; text: string }> = [];
  let summary = '';
  
  switch (input.structureType) {
    case 'act-structure':
      generatedBlocks = [
        { id: `block-${Date.now()}-1`, type: 'section', text: 'ACT I - SETUP' },
        { id: `block-${Date.now()}-2`, type: 'synopsis', text: 'Inciting incident and establishing normal world' },
        { id: `block-${Date.now()}-3`, type: 'section', text: 'ACT II - CONFRONTATION' },
        { id: `block-${Date.now()}-4`, type: 'synopsis', text: 'Rising action, midpoint, and complications' },
        { id: `block-${Date.now()}-5`, type: 'section', text: 'ACT III - RESOLUTION' },
        { id: `block-${Date.now()}-6`, type: 'synopsis', text: 'Climax and resolution' },
      ];
      summary = 'Generated three-act structure';
      break;
      
    case 'scene-sequence':
      const sceneCount = input.count || 3;
      generatedBlocks = Array.from({ length: sceneCount }, (_, i) => ({
        id: `block-${Date.now()}-${i}`,
        type: 'scene-heading',
        text: `INT. LOCATION ${i + 1} - DAY`,
      }));
      summary = `Generated ${sceneCount} scene headings`;
      break;
      
    case 'dialogue-exchange':
      generatedBlocks = [
        { id: `block-${Date.now()}-1`, type: 'character', text: 'CHARACTER A' },
        { id: `block-${Date.now()}-2`, type: 'dialogue', text: 'Dialogue line 1' },
        { id: `block-${Date.now()}-3`, type: 'character', text: 'CHARACTER B' },
        { id: `block-${Date.now()}-4`, type: 'dialogue', text: 'Dialogue line 2' },
      ];
      summary = 'Generated dialogue exchange template';
      break;
      
    case 'plot-points':
      generatedBlocks = [
        { id: `block-${Date.now()}-1`, type: 'section', text: 'PLOT POINT 1: Inciting Incident' },
        { id: `block-${Date.now()}-2`, type: 'section', text: 'PLOT POINT 2: First Turning Point' },
        { id: `block-${Date.now()}-3`, type: 'section', text: 'PLOT POINT 3: Midpoint' },
        { id: `block-${Date.now()}-4`, type: 'section', text: 'PLOT POINT 4: Second Turning Point' },
        { id: `block-${Date.now()}-5`, type: 'section', text: 'PLOT POINT 5: Climax' },
      ];
      summary = 'Generated key plot points structure';
      break;
  }
  
  return {
    generatedBlocks,
    summary,
  };
}

/**
 * Tool: Search and Insert
 * Searches existing story notes and inserts relevant content
 */
export const SearchAndInsertInputSchema = z.object({
  query: z.string().describe('Search query to find relevant story notes or context.'),
  insertionPointId: z.string().describe('Block ID where the content should be inserted after.'),
  contentType: z.enum(['dialogue', 'action', 'character-note', 'world-detail']).describe('Type of content to insert.'),
});

export type SearchAndInsertInput = z.infer<typeof SearchAndInsertInputSchema>;

export const SearchAndInsertOutputSchema = z.object({
  insertedBlockId: z.string().describe('ID of the newly inserted block.'),
  insertedText: z.string().describe('The text that was inserted.'),
  sourceContext: z.string().describe('Where the content came from (e.g., which story note).'),
  summary: z.string().describe('Summary of the insertion.'),
});

export type SearchAndInsertOutput = z.infer<typeof SearchAndInsertOutputSchema>;

/**
 * Prepare context for search and insert
 * This returns the search query structure that the AI flow should use
 */
export function prepareSearchAndInsertContext(
  input: SearchAndInsertInput,
  relevantContext: string
): {
  query: string;
  context: string;
  insertionPoint: string;
  contentType: string;
} {
  return {
    query: input.query,
    context: relevantContext,
    insertionPoint: input.insertionPointId,
    contentType: input.contentType,
  };
}
