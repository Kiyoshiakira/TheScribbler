'use server';
/**
 * @fileOverview A comprehensive AI analysis tool for screenplays.
 *
 * - aiDeepAnalysis - A function that performs a deep analysis of a screenplay.
 * - AiDeepAnalysisInput - The input type for the function.
 * - AiDeepAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import {z} from 'genkit';

const AiDeepAnalysisInputSchema = z.object({
  screenplay: z.string().describe('The screenplay text to analyze.'),
});
export type AiDeepAnalysisInput = z.infer<typeof AiDeepAnalysisInputSchema>;

const AnalysisItemSchema = z.object({
  point: z.string().describe('A specific point of feedback or analysis.'),
  suggestion: z.string().describe('A concrete suggestion for improvement related to the point.'),
});

const AiDeepAnalysisOutputSchema = z.object({
  plotAnalysis: z.array(AnalysisItemSchema).describe('Analysis and suggestions related to the plot, pacing, and structure.'),
  characterAnalysis: z.array(AnalysisItemSchema).describe('Analysis and suggestions related to character arcs, motivations, and consistency.'),
  dialogueAnalysis: z.array(AnalysisItemSchema).describe('Analysis and suggestions related to the dialogue, subtext, and character voices.'),
});
export type AiDeepAnalysisOutput = z.infer<typeof AiDeepAnalysisOutputSchema>;

export async function aiDeepAnalysis(
  input: AiDeepAnalysisInput
): Promise<AiDeepAnalysisOutput> {
  return aiDeepAnalysisFlow(input);
}

const prompt = ai.definePrompt({
    name: 'deepAnalysisPrompt',
    input: { schema: AiDeepAnalysisInputSchema },
    output: { schema: AiDeepAnalysisOutputSchema },
    prompt: `You are an expert script doctor and story analyst.

  Your task is to perform a deep analysis of the provided screenplay. Provide structured, constructive feedback broken down into three categories: Plot, Character, and Dialogue.

  For each category, provide specific points of analysis and actionable suggestions for improvement.

  Screenplay:
  {{{screenplay}}}

  Analyze the screenplay and provide your feedback in the structured format required.`,
});

const aiDeepAnalysisFlow = ai.defineFlow(
  {
    name: 'aiDeepAnalysisFlow',
    inputSchema: AiDeepAnalysisInputSchema,
    outputSchema: AiDeepAnalysisOutputSchema,
  },
  async input => {
    const model = googleAI('gemini-2.5-flash');
    const {output} = await ai.generate({
      model,
      prompt: prompt,
      input: input,
      output: { schema: AiDeepAnalysisOutputSchema },
      config: {
        temperature: 0.5,
      },
    });
    if (!output) {
      throw new Error('AI failed to return a valid analysis. The output did not match the expected format.');
    }
    return output;
  }
);
