'use server';
/**
 * @fileOverview An AI tool that reviews existing screenplay, offers potential paths that story may take,
 * provides alternatives or missing information (such as character descriptions, world or environment, sounds, scene descriptions).
 *
 * - aiSuggestSceneImprovements - A function that suggests improvements for a screenplay.
 * - AiSuggestSceneImprovementsInput - The input type for the aiSuggestSceneImprovements function.
 * - AiSuggestSceneImprovementsOutput - The return type for the aiSuggestSceneImprovements function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiSuggestSceneImprovementsInputSchema = z.object({
  screenplay: z.string().describe('The screenplay text to analyze.'),
});
export type AiSuggestSceneImprovementsInput = z.infer<typeof AiSuggestSceneImprovementsInputSchema>;

const AiSuggestSceneImprovementsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('A list of AI-generated suggestions for improving the screenplay.'),
});
export type AiSuggestSceneImprovementsOutput = z.infer<typeof AiSuggestSceneImprovementsOutputSchema>;

export async function aiSuggestSceneImprovements(
  input: AiSuggestSceneImprovementsInput
): Promise<AiSuggestSceneImprovementsOutput> {
  return aiSuggestSceneImprovementsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiSuggestSceneImprovementsPrompt',
  input: {schema: AiSuggestSceneImprovementsInputSchema},
  output: {schema: AiSuggestSceneImprovementsOutputSchema},
  prompt: `You are a screenplay expert providing constructive feedback on a given screenplay.

Analyze the screenplay and provide a list of suggestions for improvements.
Consider aspects such as scene descriptions, character development, and plot progression.

Screenplay:
{{screenplay}}

Suggestions:
`,
});

const aiSuggestSceneImprovementsFlow = ai.defineFlow(
  {
    name: 'aiSuggestSceneImprovementsFlow',
    inputSchema: AiSuggestSceneImprovementsInputSchema,
    outputSchema: AiSuggestSceneImprovementsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('AI failed to return valid suggestions. The output did not match the expected format.');
    }
    return output;
  }
);
