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

const AiGenerateCharacterProfileOutputSchema = z.object({
  name: z.string().describe("The character's full name."),
  profile: z
    .string()
    .describe(
      'A detailed character profile that includes backstory, personality, motivations, and quirks.'
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

const orchestratorPrompt = ai.definePrompt(
  {
    name: 'aiAgentOrchestratorPrompt',
    input: { schema: AiAgentOrchestratorInputSchema },
    output: {
      format: 'json',
      schema: z.object({
        response: z
          .string()
          .describe("The AI's friendly, conversational response to the user."),
        modifiedScript: z
          .string()
          .optional()
          .describe(
            "If the user's request required changing the script, this is the FULL, new script content. Otherwise, this is omitted."
          ),
      }),
    },
    prompt: `You are an expert AI assistant for a screenwriting application.
Your goal is to help the user modify their script and other project elements.

Analyze the user's request and the current script content.

- If the user is asking to create a character, use the generateCharacter tool.
- If the user is asking for a change to the script, rewrite the script content and provide a response explaining what you did.
- If the user is asking a question or for analysis, respond directly with text.

**User Request:**
${'{{{request}}}'}

**Current Screenplay:**
---
${'{{{script}}}'}
---
`,
  },
  async (input) => {
    const llmResponse = await ai.generate({
      prompt: input,
      model: 'googleai/gemini-2.5-flash',
      tools: [
        ai.defineTool(
          {
            name: 'generateCharacter',
            description:
              'Generates a new character profile based on a description.',
            inputSchema: z.object({
              description: z
                .string()
                .describe(
                  'A brief description of the character to be created.'
                ),
            }),
            outputSchema: AiGenerateCharacterProfileOutputSchema,
          },
          async (input): Promise<AiGenerateCharacterProfileOutput> => {
            return await aiGenerateCharacterProfile({
              characterDescription: input.description,
            });
          }
        ),
      ],
    });
    return llmResponse.output();
  }
);


const aiAgentOrchestratorFlow = ai.defineFlow(
  {
    name: 'aiAgentOrchestratorFlow',
    inputSchema: AiAgentOrchestratorInputSchema,
    outputSchema: AiAgentOrchestratorOutputSchema,
  },
  async input => {
    const structuredOutput = await orchestratorPrompt(input);

    if (!structuredOutput) {
      return { response: "I'm sorry, I wasn't able to process that request." };
    }

    const output = structuredOutput.output;
    if (!output) {
      return { response: "I'm sorry, I wasn't able to process that request." };
    }


    let toolResult: any = null;
    const toolCalls = structuredOutput.toolCalls();

    if (toolCalls.length > 0) {
      const toolCall = toolCalls[0];
      if (toolCall.name === 'generateCharacter') {
        const characterData = await toolCall.run();
        toolResult = {
          type: 'character',
          data: characterData,
        };
      }
    }

    return {
      response: output.response,
      modifiedScript: output.modifiedScript,
      toolResult: toolResult,
    };
  }
);
