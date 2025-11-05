'use server';
/**
 * @fileOverview An AI flow for reformatting script text into standard screenplay format.
 *
 * - aiReformatScript - A function that takes raw text and reformats it.
 * - AiReformatScriptInput - The input type for the function.
 * - AiReformatScriptOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';

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

const prompt = ai.definePrompt(
    {
        name: 'reformatScriptPrompt',
        model: googleAI.model('gemini-2.5-flash'),
        input: { schema: AiReformatScriptInputSchema },
        output: { schema: AiReformatScriptOutputSchema },
        prompt: `You are an expert script formatter specializing in Fountain syntax.

  Your task is to take the provided raw text and reformat it into clean, valid Fountain format.

  **Fountain Syntax Rules:**
  1.  Scene Headings: Start with INT., EXT., or I/E. followed by location and time (e.g., "INT. COFFEE SHOP - DAY"). Must be on their own line and in ALL CAPS.
  2.  Character Names: Must be on their own line and in ALL CAPS (e.g., "JOHN" or "SARAH (V.O.)"). LEFT-ALIGNED, NOT centered.
  3.  Dialogue: Plain text directly below the character name. Do not indent.
  4.  Parentheticals: Wrapped in parentheses (e.g., "(whispering)") on their own line between character and dialogue.
  5.  Action/Description: Plain text paragraphs describing what happens in the scene.
  6.  Transitions: ALL CAPS with colon (e.g., "CUT TO:", "FADE OUT:"). For forced transitions, prefix with > (e.g., "> SMASH CUT TO:").
  7.  Blank Lines: Use blank lines to separate different elements (scene headings, character dialogue blocks, action paragraphs).

  **Important:** 
  - Character names are LEFT-ALIGNED in Fountain, not centered (centering happens during rendering)
  - Keep proper spacing: blank line before scene headings, between dialogue blocks
  - Preserve all content, just fix the formatting

  **Raw Script Text to Reformat:**
  \`\`\`
  {{{rawScript}}}
  \`\`\`
  `,
    }
);

const aiReformatScriptFlow = ai.defineFlow(
  {
    name: 'aiReformatScriptFlow',
    inputSchema: AiReformatScriptInputSchema,
    outputSchema: AiReformatScriptOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error(
        'AI failed to return a valid formatted script. The output did not match the expected format.'
      );
    }
    return output;
  }
);
