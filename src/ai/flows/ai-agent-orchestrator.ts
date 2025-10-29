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
  response: z.string().describe('The AI\'s response to the user\'s request, which may include the results of tool calls.'),
  toolResult: z.any().optional().describe('The direct result from any tool that was called.'),
});
export type AiAgentOrchestratorOutput = z.infer<typeof AiAgentOrchestratorOutputSchema>;

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
  async input => {
    
    const llmResponse = await ai.generate({
      prompt: `You are an expert AI assistant for a screenwriting application.
Your goal is to help the user modify their script and other project elements.

Analyze the user's request and the current script content.
Decide whether to use one of the available tools or to respond directly with text.

**User Request:**
${input.request}

**Current Screenplay:**
---
${input.script}
---
`,
      tools: [], // Tools are deprecated in favor of specific flows
      model: 'googleai/gemini-2.5-flash-preview',
    });

    const toolRequest = llmResponse.toolRequest;

    if (toolRequest) {
      // If the LLM wants to use a tool, we need to call it and return the result.
      const toolResponse = await toolRequest.run();
      
      // Now, we need to send the tool's response back to the LLM to get a final, user-friendly summary.
      const finalResponse = await ai.generate({
          prompt: `You have just used a tool to fulfill the user's request.
          The user's original request was: "${input.request}"
          The result from the tool is here:
          ---
          ${JSON.stringify(toolResponse)}
          ---
          
          Summarize this result in a friendly, conversational way.
          `,
          model: 'googleai/gemini-2.5-flash-preview',
      });
      
      return { 
        response: finalResponse.text,
        toolResult: toolResponse, // Pass the raw tool result back
      };
    }

    // If no tool was used, just return the direct text response.
    return { response: llmResponse.text };
  }
);
