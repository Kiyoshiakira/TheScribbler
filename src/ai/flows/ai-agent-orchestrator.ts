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


// Define Schemas and Tool directly in the orchestrator file
const CharacterProfileInputSchema = z.object({
  characterDescription: z
    .string()
    .describe('A brief description or traits of the character.'),
});

const CharacterProfileOutputSchema = z.object({
  name: z.string().describe("The character's full name."),
  profile: z
    .string()
    .describe(
      'A detailed character profile that includes backstory, personality, motivations, and quirks.'
    ),
});

const generateCharacterProfileTool = ai.defineTool(
  {
    name: 'generateCharacterProfile',
    description: 'Generates a detailed character profile based on a brief description. Use this when the user wants to create a new character.',
    inputSchema: CharacterProfileInputSchema,
    outputSchema: CharacterProfileOutputSchema,
  },
  async input => {
    const prompt = `You are an expert screenwriter and character creator.

  Based on the provided character description, generate a plausible full name and a detailed character profile. The profile should be a rich narrative including:

  - Backstory and formative experiences.
  - Core personality traits, strengths, and flaws.
  - Motivations, goals, and fears.
  - Any interesting quirks or unique characteristics.

  Character Description: ${input.characterDescription}
  `;

    const { output } = await ai.generate({
      prompt: prompt,
      output: {
        schema: CharacterProfileOutputSchema,
      },
    });
    return output!;
  }
);


const AiAgentOrchestratorInputSchema = z.object({
  request: z.string().describe('The user\'s natural language request.'),
  script: z.string().describe('The current state of the screenplay.'),
});
export type AiAgentOrchestratorInput = z.infer<typeof AiAgentOrchestratorInputSchema>;

const AiAgentOrchestratorOutputSchema = z.object({
  response: z.string().describe('The AI\'s response to the user\'s request, which may include the results of tool calls.'),
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
      Use the available tools to fulfill the user's request.
      
      If a tool is used, summarize the result in a friendly, conversational way.
      If no specific tool seems appropriate, provide a helpful and informative text response.

      User Request: ${input.request}

      Current Screenplay:
      ---
      ${input.script}
      ---
      `,
      tools: [generateCharacterProfileTool],
      model: 'googleai/gemini-2.5-flash-preview',
    });

    const toolResponse = llmResponse.toolRequest?.output;

    if (toolResponse) {
        // If a tool was used, format the output for the user.
        const characterProfile = toolResponse[0].result as z.infer<typeof CharacterProfileOutputSchema>;
        const responseText = `I've created a new character for you!\n\n**Name:** ${characterProfile.name}\n\n**Profile:**\n${characterProfile.profile}`;
        return { response: responseText };
    }

    return { response: llmResponse.text };
  }
);
