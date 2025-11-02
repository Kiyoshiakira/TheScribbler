'use server';
/**
 * @fileOverview A dedicated AI flow for generating character profiles.
 *
 * - aiGenerateCharacterProfile - A function that generates a detailed character profile.
 * - AiGenerateCharacterProfileInput - The input type for the function.
 * - AiGenerateCharacterProfileOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const AiGenerateCharacterProfileInputSchema = z.object({
  characterDescription: z
    .string()
    .describe('A brief description or traits of the character.'),
});
export type AiGenerateCharacterProfileInput = z.infer<
  typeof AiGenerateCharacterProfileInputSchema
>;

const AiGenerateCharacterProfileOutputSchema = z.object({
  name: z.string().describe("The character's full name."),
  profile: z
    .string()
    .describe(
      'A detailed character profile that includes backstory, personality, motivations, and quirks.'
    ),
});
export type AiGenerateCharacterProfileOutput = z.infer<
  typeof AiGenerateCharacterProfileOutputSchema
>;

export async function aiGenerateCharacterProfile(
  input: AiGenerateCharacterProfileInput
): Promise<AiGenerateCharacterProfileOutput> {
  return aiGenerateCharacterProfileFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiGenerateCharacterProfilePrompt',
  input: { schema: AiGenerateCharacterProfileInputSchema },
  output: { schema: AiGenerateCharacterProfileOutputSchema },
  prompt: `You are an expert screenwriter and character creator.

  Your task is to generate a detailed character profile based on a simple description.

  **Instructions:**
  1.  Create a plausible full name for the character.
  2.  Write a rich, narrative-style character profile that includes:
      -   **Backstory:** Key life events and formative experiences.
      -   **Personality:** Core traits, strengths, flaws, and contradictions.
      -   **Motivations:** Their primary goals, desires, and what drives them.
      -   **Fears:** What they are most afraid of, both physically and emotionally.
      -   **Quirks:** Interesting habits or unique characteristics that make them memorable.

  **Character Description:**
  \`\`\`
  {{{characterDescription}}}
  \`\`\`
  `,
});

const aiGenerateCharacterProfileFlow = ai.defineFlow(
  {
    name: 'aiGenerateCharacterProfileFlow',
    inputSchema: AiGenerateCharacterProfileInputSchema,
    outputSchema: AiGenerateCharacterProfileOutputSchema,
  },
  async input => {
    const model = googleAI('gemini-2.5-flash-latest');
    const { output } = await ai.generate({
      model,
      prompt: prompt.prompt,
      input: input,
      output: { schema: AiGenerateCharacterProfileOutputSchema },
      config: {
        timeout: 30000,
      }
    });
    if (!output) {
      throw new Error('AI failed to return a valid character profile. The output did not match the expected format.');
    }
    return output;
  }
);
