'use server';
/**
 * @fileOverview An AI tool that proofreads a screenplay for errors.
 *
 * - aiProofreadScript - A function that proofreads a screenplay.
 * - AiProofreadScriptInput - The input type for the function.
 * - AiProofreadScriptOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { SCRIPT_TOKEN_LIMIT } from '@/constants';

const AiProofreadScriptInputSchema = z.object({
  script: z.string().describe('The screenplay text to proofread.'),
});
export type AiProofreadScriptInput = z.infer<
  typeof AiProofreadScriptInputSchema
>;

const CorrectionSuggestionSchema = z.object({
  originalText: z
    .string()
    .describe('The exact segment of text that contains the error.'),
  correctedText: z
    .string()
    .describe('The suggested replacement for the original text.'),
  explanation: z
    .string()
    .describe('A brief explanation of why the change is being suggested (e.g., "Spelling error", "Grammatical mistake", "Continuity issue").'),
});

const AiProofreadScriptOutputSchema = z.object({
  suggestions: z
    .array(CorrectionSuggestionSchema)
    .describe('A list of suggested corrections for the screenplay.'),
});
export type AiProofreadScriptOutput = z.infer<
  typeof AiProofreadScriptOutputSchema
>;

export async function aiProofreadScript(
  input: AiProofreadScriptInput
): Promise<AiProofreadScriptOutput> {
  return aiProofreadScriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiProofreadScriptPrompt',
  input: { schema: AiProofreadScriptInputSchema },
  output: { schema: AiProofreadScriptOutputSchema },
  prompt: `You are an expert proofreader and script supervisor for screenplays.

  Your task is to analyze the provided screenplay and identify errors. You MUST NOT make creative changes to the story, characters, or dialogue. Your focus is exclusively on correctness.

  Analyze the following categories in order:
  1.  **Formatting:** Ensure standard screenplay formatting is used (e.g., character names are capitalized, scene headings are correct).
  2.  **Grammar and Spelling:** Find and correct typos and grammatical mistakes.
  3.  **Continuity:** Look for logical inconsistencies. For example, a character's name changing, an object appearing or disappearing without reason, or referencing an event that hasn't happened.

  For each error you find, provide the original text, the corrected version, and a brief explanation.

  **IMPORTANT:** If the script is well-written and you find no errors, return an empty array for the suggestions. Do not invent errors.

  **Screenplay to Analyze:**
  \`\`\`
  {{{script}}}
  \`\`\`
  `,
});

const aiProofreadScriptFlow = ai.defineFlow(
  {
    name: 'aiProofreadScriptFlow',
    inputSchema: AiProofreadScriptInputSchema,
    outputSchema: AiProofreadScriptOutputSchema,
  },
  async input => {
    // If the script is very short, it's probably not worth analyzing.
    if (input.script.length < 50) {
      return { suggestions: [] };
    }
     // Prevent token limit errors.
    if (input.script.length > SCRIPT_TOKEN_LIMIT) {
        return { suggestions: [] };
    }
    const { output } = await ai.generate({
      prompt: prompt.prompt,
      input: input,
      output: { schema: AiProofreadScriptOutputSchema },
      model: googleAI(process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest'),
    });
    if (!output) {
      throw new Error('AI failed to return valid proofreading suggestions. The output did not match the expected format.');
    }
    return output;
  }
);
