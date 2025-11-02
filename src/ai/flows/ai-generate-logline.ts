'use server';
/**
 * @fileOverview An AI flow for generating a screenplay logline.
 *
 * - aiGenerateLogline - A function that generates a logline from a script.
 * - AiGenerateLoglineInput - The input type for the function.
 * - AiGenerateLoglineOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const AiGenerateLoglineInputSchema = z.object({
  screenplay: z.string().describe('The full screenplay text.'),
});
export type AiGenerateLoglineInput = z.infer<
  typeof AiGenerateLoglineInputSchema
>;

const AiGenerateLoglineOutputSchema = z.object({
  logline: z
    .string()
    .describe(
      'A compelling, one-sentence logline that summarizes the screenplay.'
    ),
});
export type AiGenerateLoglineOutput = z.infer<
  typeof AiGenerateLoglineOutputSchema
>;

export async function aiGenerateLogline(
  input: AiGenerateLoglineInput
): Promise<AiGenerateLoglineOutput> {
  return aiGenerateLoglineFlow(input);
}

const prompt = `You are an expert Hollywood script reader.

  Your task is to read the provided screenplay and write a powerful, industry-standard logline.

  **Instructions:**
  1.  Identify the protagonist.
  2.  Determine their primary goal.
  3.  Identify the main obstacle or antagonist.
  4.  Combine these elements into a single, concise, and compelling sentence.

  **Screenplay to Analyze:**
  \`\`\`
  {{{screenplay}}}
  \`\`\`
  `;

const aiGenerateLoglineFlow = ai.defineFlow(
  {
    name: 'aiGenerateLoglineFlow',
    inputSchema: AiGenerateLoglineInputSchema,
    outputSchema: AiGenerateLoglineOutputSchema,
  },
  async input => {
    const model = googleAI('gemini-2.5-flash');
    const { output } = await ai.generate({
      model,
      prompt: prompt,
      input: input,
      output: { schema: AiGenerateLoglineOutputSchema },
      config: {
        timeout: 30000,
      }
    });
    if (!output) {
      throw new Error('AI failed to return a valid logline. The output did not match the expected format.');
    }
    return output;
  }
);
