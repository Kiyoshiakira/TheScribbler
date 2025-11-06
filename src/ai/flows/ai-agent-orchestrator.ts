'use server';
/**
 * @fileOverview The main AI agent orchestrator.
 * This flow is responsible for interpreting user requests and dispatching them to the appropriate tools or sub-flows.
 *
 * - aiAgentOrchestrator - The main function that orchestrates the AI agent's response.
 * - AiAgentOrchestratorInput - The input type for the function.
 * - AiAgentOrchestratorOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import {
  aiGenerateCharacterProfile,
  type AiGenerateCharacterProfileOutput,
} from './ai-generate-character-profile';
import {
  aiProofreadScript,
  type AiProofreadScriptOutput,
} from './ai-proofread-script';
import {
  aiReformatScript,
  type AiReformatScriptOutput,
} from './ai-reformat-script';
import { ScriptBlock, ScriptDocument } from '@/lib/editor-types';


const ScriptBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot', 'centered', 'section', 'synopsis']),
  text: z.string(),
});

const ScriptDocumentSchema = z.object({
  blocks: z.array(ScriptBlockSchema),
});

const AiAgentOrchestratorInputSchema = z.object({
  request: z.string().describe("The user's natural language request."),
  document: ScriptDocumentSchema.describe('The current state of the screenplay as a structured document.'),
});
export type AiAgentOrchestratorInput = z.infer<
  typeof AiAgentOrchestratorInputSchema
>;

const AiAgentOrchestratorOutputSchema = z.object({
  response: z
    .string()
    .describe(
      "The AI's response to the user's request, which may include the results of tool calls."
    ),
  toolResult: z
    .any()
    .optional()
    .describe('The direct result from any tool that was called.'),
  modifiedDocument: ScriptDocumentSchema
    .optional()
    .describe(
      'The full, rewritten script document if the user requested a change.'
    ),
});
export type AiAgentOrchestratorOutput = z.infer<
  typeof AiAgentOrchestratorOutputSchema
>;

export async function aiAgentOrchestrator(
  input: AiAgentOrchestratorInput
): Promise<AiAgentOrchestratorOutput> {
  return aiAgentOrchestratorFlow(input);
}

const aiAgentOrchestratorFlow = ai.defineFlow(
  {
    name: 'aiAgentOrchestratorFlow',
    inputSchema: AiAgentOrchestratorInputSchema,
    outputSchema: AiAgentOrchestratorOutputSchema,
  },
  async (input) => {
    const scriptAsString = JSON.stringify(input.document);

    // For now, we'll use a simpler approach that doesn't rely on tool calling
    // which has API changes in newer Genkit versions
    
    // Check if user wants to create a character
    if (input.request.toLowerCase().includes('create') && 
        (input.request.toLowerCase().includes('character') || input.request.toLowerCase().includes('profile'))) {
      const characterResult = await aiGenerateCharacterProfile({
        characterDescription: input.request,
      });
      
      return {
        response: `I've created a character profile for ${characterResult.name}:\n\n${characterResult.profile}`,
        toolResult: {
          type: 'character',
          data: characterResult,
        },
      };
    }
    
    // Check if user wants to proofread
    if (input.request.toLowerCase().includes('proofread') || 
        input.request.toLowerCase().includes('check for errors') ||
        input.request.toLowerCase().includes('mistakes')) {
      const proofreadResult = await aiProofreadScript({
        script: scriptAsString,
      });
      
      return {
        response: `I've proofread your script and found ${proofreadResult.suggestions.length} suggestion(s).`,
        toolResult: {
          type: 'proofread',
          data: proofreadResult,
        },
      };
    }
    
    // Check if user wants to reformat
    if (input.request.toLowerCase().includes('reformat') || 
        input.request.toLowerCase().includes('clean up') ||
        input.request.toLowerCase().includes('fix format') ||
        input.request.toLowerCase().includes('squished')) {
      const reformatResult = await aiReformatScript({
        rawScript: scriptAsString,
      });
      
      const modifiedScriptAsString = reformatResult.formattedScript;
      
      return {
        response: "I've reformatted your script to standard screenplay format.",
        modifiedDocument: { 
          blocks: modifiedScriptAsString.split('\n\n').map((line, index) => ({ 
            id: `block-${index}-${Date.now()}`, 
            text: line, 
            type: 'action' as const 
          }))
        },
        toolResult: {
          type: 'reformat',
          data: reformatResult,
        },
      };
    }
    
    // For general questions, use a simple prompt
    const generalPrompt = ai.definePrompt({
      name: 'generalQuestionPrompt',
      model: googleAI.model('gemini-2.5-flash'),
      input: { 
        schema: z.object({
          request: z.string(),
          document: ScriptDocumentSchema,
        })
      },
      output: { 
        schema: z.object({
          response: z.string(),
        })
      },
      prompt: `You are an expert AI assistant for a screenwriting application.

The user asked: {{{request}}}

Current screenplay document:
{{{json document}}}

Provide a helpful, conversational answer to their question.`,
      config: {
        temperature: 0.3,
      }
    });
    
    const { output } = await generalPrompt(input);
    
    return {
      response: output?.response || "I'm here to help with your screenplay. How can I assist you?",
    };
  }
);

    