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

const AiAgentOrchestratorInputSchema = z.object({
  request: z.string().describe('The user\'s natural language request.'),
  script: z.string().describe('The current state of the screenplay.'),
});
export type AiAgentOrchestratorInput = z.infer<typeof AiAgentOrchestratorInputSchema>;

const AiAgentOrchestratorOutputSchema = z.object({
  response: z.string().describe('The AI\'s response to the user\'s request.'),
  // In the future, this could include structured data for actions to be taken.
});
export type AiAgentOrchestratorOutput = z.infer<typeof AiAgentOrchestratorOutputSchema>;

export async function aiAgentOrchestrator(
  input: AiAgentOrchestratorInput
): Promise<AiAgentOrchestratorOutput> {
  return aiAgentOrchestratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAgentOrchestratorPrompt',
  input: { schema: AiAgentOrchestratorInputSchema },
  output: { schema: AiAgentOrchestratorOutputSchema },
  prompt: `You are an expert AI assistant for a screenwriting application.
  Your goal is to help the user modify their script and other project elements.

  Analyze the user's request and the current script content.
  For now, your capabilities are limited to responding with text.
  In the future, you will have tools to modify the script, add characters, scenes, etc.

  Based on the request, provide a helpful and informative text response. Acknowledge the request and explain what you *would* do if you had the tools.

  User Request: {{{request}}}

  Current Screenplay:
  ---
  {{{script}}}
  ---
  `,
});

const aiAgentOrchestratorFlow = ai.defineFlow(
  {
    name: 'aiAgentOrchestratorFlow',
    inputSchema: AiAgentOrchestratorInputSchema,
    outputSchema: AiAgentOrchestratorOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
