'use server';
/**
 * @fileOverview An AI flow for reformatting script text into standard screenplay format.
 *
 * - aiReformatScript - A function that takes raw text and reformats it.
 * - AiReformatScriptInput - The input type for the function.
 * - AiReformatScriptOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const AiReformatScriptInputSchema = z.object({
  rawScript: z
    .string()
    .describe('The raw, potentially poorly formatted, script text.'),
});
export type AiReformatScriptInput = z.infer<
  typeof AiReformatScriptInputSchema
>;

const AiReformatScriptOutputSchema = z.object({
  formattedScript: z
    .string()
    .describe(
      'The script text, reformatted to meet standard screenplay conventions.'
    ),
});
export type AiReformatScriptOutput = z.infer<
  typeof AiReformatScriptOutputSchema
>;

export async function aiReformatScript(
  input: AiReformatScriptInput
): Promise<AiReformatScriptOutput> {
  return aiReformatScriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiReformatScriptPrompt',
  input: { schema: AiReformatScriptInputSchema },
  output: { schema: AiReformatScriptOutputSchema },
  prompt: `You are an expert script formatter.

  Your task is to take the provided raw text and reformat it into a clean, readable, industry-standard screenplay format.

  **Instructions:**
  1.  Identify Scene Headings (e.g., "INT. ROOM - DAY") and format them correctly on their own line and in all caps.
  2.  Identify Character names (e.g., "JOHN DOE") and place them on their own line, in all caps, and centered.
  3.  Identify Dialogue and place it directly below the character name.
  4.  Identify Parentheticals (e.g., "(beat)") and place them on their own line, indented, between the character and dialogue.
  5.  Identify Action lines (scene descriptions) and format them as standard paragraphs.
  6.  Ensure there are appropriate blank lines between elements for readability (e.g., before scene headings, between a character's dialogue and the next character).

  **Raw Script Text to Reformat:**
  \`\`\`
  {{{rawScript}}}
  \`\`\`
  `,
});

const aiReformatScriptFlow = ai.defineFlow(
  {
    name: 'aiReformatScriptFlow',
    inputSchema: AiReformatScriptInputSchema,
    outputSchema: AiReformatScriptOutputSchema,
  },
  async input => {
    const model = googleAI('gemini-2.5-flash-latest');
    const { output } = await ai.generate({
      model,
      prompt: prompt.prompt,
      input: input,
      output: { schema: AiReformatScriptOutputSchema },
      config: {
        timeout: 30000,
      }
    });
    if (!output) {
      throw new Error(
        'AI failed to reformat the script. The output did not match the expected format.'
      );
    }
    return output;
  }
);
