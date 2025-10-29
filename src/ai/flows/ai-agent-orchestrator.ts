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
import { z } from 'genkit';
import {
  aiGenerateCharacterProfile,
  type AiGenerateCharacterProfileOutput,
} from './ai-generate-character-profile';
import {
  aiProofreadScript,
  type AiProofreadScriptOutput,
} from './ai-proofread-script';

const AiGenerateCharacterProfileOutputSchema = z.object({
  name: z.string().describe("The character's full name."),
  profile: z
    .string()
    .describe(
      'A detailed character profile that includes backstory, personality, motivations, and quirks.'
    ),
});

const AiProofreadScriptOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      originalText: z.string(),
      correctedText: z.string(),
      explanation: z.string(),
    })
  ),
});

const AiAgentOrchestratorInputSchema = z.object({
  request: z.string().describe("The user's natural language request."),
  script: z.string().describe('The current state of the screenplay.'),
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
  modifiedScript: z
    .string()
    .optional()
    .describe(
      'The full, rewritten script content if the user requested a change.'
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

// Define tools separately
const generateCharacterTool = ai.defineTool(
  {
    name: 'generateCharacter',
    description: 'Generates a new character profile based on a description.',
    inputSchema: z.object({
      description: z
        .string()
        .describe('A brief description of the character to be created.'),
    }),
    outputSchema: AiGenerateCharacterProfileOutputSchema,
  },
  async (toolInput): Promise<AiGenerateCharacterProfileOutput> => {
    return await aiGenerateCharacterProfile({
      characterDescription: toolInput.description,
    });
  }
);

const proofreadScriptTool = ai.defineTool(
    {
        name: 'proofreadScript',
        description: 'Proofreads the script for formatting, spelling, and grammatical errors.',
        inputSchema: z.object({
            script: z.string().describe('The full script to proofread.'),
        }),
        outputSchema: AiProofreadScriptOutputSchema,
    },
    async ({script}): Promise<AiProofreadScriptOutput> => {
        return await aiProofreadScript({ script });
    }
);

const orchestratorPrompt = `You are an expert AI assistant for a screenwriting application.
Your goal is to help the user modify their script and other project elements.

Analyze the user's request and the current script content.

- If the user is asking to create a character, use the generateCharacter tool.
- If the user is asking to proofread, check formatting, or find errors, use the proofreadScript tool with the current script content.
- If the user is asking for a direct change to the script content (and not just proofreading), rewrite the script and provide a response explaining what you did.
- If the user is asking a general question or for analysis, respond directly with text.

**User Request:**
{{{request}}}

**Current Screenplay:**
---
{{{script}}}
---
`;


const aiAgentOrchestratorFlow = ai.defineFlow(
  {
    name: 'aiAgentOrchestratorFlow',
    inputSchema: AiAgentOrchestratorInputSchema,
    outputSchema: AiAgentOrchestratorOutputSchema,
  },
  async (input) => {
    // First, generate a response from the model.
    let llmResponse = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      prompt: orchestratorPrompt,
      input,
      tools: [generateCharacterTool, proofreadScriptTool],
      output: {
        format: 'json',
        schema: z.object({
          response: z
            .string()
            .describe(
              "The AI's friendly, conversational response to the user."
            ),
          modifiedScript: z
            .string()
            .optional()
            .describe(
              "If the user's request required changing the script, this is the FULL, new script content. Otherwise, this is omitted."
            ),
        }),
      },
    });

    let toolResult: any = null;

    // Check if the model requested any tools to be called.
    if (llmResponse.toolRequests.length > 0) {
      const toolResponses = [];
       for (const toolRequest of llmResponse.toolRequests) {
         let toolOutput: any;
         let toolType: string | null = null;
         if (toolRequest.name === 'generateCharacter') {
           toolOutput = await toolRequest.run();
           toolType = 'character';
         }
         if (toolRequest.name === 'proofreadScript') {
           toolOutput = await toolRequest.run();
           toolType = 'proofread';
         }

         if (toolOutput) {
            toolResult = {
                type: toolType,
                data: toolOutput,
            };
            toolResponses.push(toolRequest.response(toolOutput));
         }
       }
        
       // If tools were called, send the results back to the model for a final response.
       llmResponse = await ai.generate({
          model: 'googleai/gemini-1.5-flash-latest',
          prompt: orchestratorPrompt,
          input,
          tools: [generateCharacterTool, proofreadScriptTool],
          history: [
            ...llmResponse.history,
            {role: 'model', content: llmResponse.toolRequests.map(tr => ({toolRequest: tr}))},
            {role: 'user', content: toolResponses.map(tr => ({toolResponse: tr}))}
          ],
          output: {
            format: 'json',
            schema: z.object({
              response: z
                .string()
                .describe(
                  "The AI's friendly, conversational response to the user, summarizing the results of the tool call."
                ),
              modifiedScript: z
                .string()
                .optional()
                .describe(
                  "This should be omitted when summarizing a tool call."
                ),
            }),
          },
       });
    }
    
    const output = llmResponse.output;
    if (!output) {
      return { response: "I'm sorry, I wasn't able to process that request." };
    }

    return {
      response: output.response,
      modifiedScript: output.modifiedScript,
      toolResult: toolResult,
    };
  }
);
