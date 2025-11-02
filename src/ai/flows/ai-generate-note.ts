'use server';
/**
 * @fileOverview A dedicated AI flow for generating notes.
 *
 * - aiGenerateNote - A function that generates a note based on a prompt.
 * - AiGenerateNoteInput - The input type for the function 遅く
 * - AiGenerateNoteOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const AiGenerateNoteInputSchema = z.object({
  prompt: z.string().describe('A simple prompt to generate a note about.'),
});
export type AiGenerateNoteInput = z.infer<typeof AiGenerateNoteInputSchema>;

const NOTE_CATEGORIES = [
  'Plot',
  'Character',
  'Dialogue',
  'Research',
  'Theme',
  'Scene',
  'General',
];

const AiGenerateNoteOutputSchema = z.object({
  title: z.string().describe('A concise title for the note.'),
  content: z.string().describe('The detailed content of the note.'),
  category: z.enum(NOTE_CATEGORIES as [string, ...string[]]).describe('The most relevant category for the note.'),
  id: z.string().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
  imageUrl: z.string().optional(),
});
export type AiGenerateNoteOutput = z.infer<typeof AiGenerateNoteOutputSchema>;

export async function aiGenerateNote(
  input: AiGenerateNoteInput
): Promise<AiGenerateNoteOutput> {
  return aiGenerateNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiGenerateNotePrompt',
  input: { schema: AiGenerateNoteInputSchema },
  output: { schema: AiGenerateNoteOutputSchema },
  prompt: `You are an expert screenwriting assistant.

  Your task is to generate a structured note based on a user's prompt.

  **Instructions:**
  1.  Create a clear and concise title for the note.
  2.  Write the full content of the note.
  3.  Categorize the note into one of the following: ${NOTE_CATEGORIES.join(', ')}.

  **User Prompt:**
  \`\`\`
  {{{prompt}}}
  \`\`\`
  `,
});

const aiGenerateNoteFlow = ai.defineFlow(
  {
    name: 'aiGenerateNoteFlow',
    inputSchema: AiGenerateNoteInputSchema,
    outputSchema: AiGenerateNoteOutputSchema,
  },
  async input => {
    const model = googleAI('gemini-2.5-flash-latest');
    const { output } = await ai.generate({
      model,
      prompt: prompt.prompt,
      input: input,
      output: { schema: AiGenerateNoteOutputSchema },
      config: {
        timeout: 30000,
      }
    });
    if (!output) {
      throw new Error('AI failed to return a valid note. The output did not match the expected format.');
    }
    return output;
  }
);
