'use server';
/**
 * @fileOverview An AI flow for diagnosing the application's health state.
 *
 * - aiDiagnoseAppHealth - A function that takes a snapshot of the app's state and analyzes it.
 * - AiDiagnoseAppHealthInput - The input type for the function.
 * - AiDiagnoseAppHealthOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';

const AiDiagnoseAppHealthInputSchema = z.object({
  appState: z
    .string()
    .describe(
      'A JSON string representing a snapshot of the application state.'
    ),
});
export type AiDiagnoseAppHealthInput = z.infer<
  typeof AiDiagnoseAppHealthInputSchema
>;

const AiDiagnoseAppHealthOutputSchema = z.object({
  diagnosis: z
    .string()
    .describe(
      'A plain-text analysis of the app state, identifying potential issues, inconsistencies, or confirming that the state looks healthy.'
    ),
});
export type AiDiagnoseAppHealthOutput = z.infer<
  typeof AiDiagnoseAppHealthOutputSchema
>;

export async function aiDiagnoseAppHealth(
  input: AiDiagnoseAppHealthInput
): Promise<AiDiagnoseAppHealthOutput> {
  return aiDiagnoseAppHealthFlow(input);
}

const prompt = `You are an expert software quality assurance engineer specializing in React and Firebase applications.

  Your task is to analyze a snapshot of the application's state and provide a health diagnosis.

  **Instructions:**
  1.  Review the provided JSON app state carefully.
  2.  Look for common problems:
      - Is the user authenticated ('isUserLoading: false', 'user' is not null)?
      - Is a script supposed to be loaded ('currentScriptId' is not null) but the script data is missing ('isScriptLoading: false', 'script' is null)?
      - Are there any inconsistencies between different contexts?
      - Does the data (e.g., number of characters, scenes) seem reasonable or is it empty when it shouldn't be?
  3.  Write a brief, plain-text diagnosis.
      - If you find issues, describe them clearly (e.g., "The user is authenticated, but the current script (ID: xyz) failed to load.").
      - If the state looks healthy, confirm that (e.g., "Application state appears healthy. User is logged in and script data is loaded correctly.").

  **Application State Snapshot:**
  \`\`\`json
  {{{appState}}}
  \`\`\`
  `;

const aiDiagnoseAppHealthFlow = ai.defineFlow(
  {
    name: 'aiDiagnoseAppHealthFlow',
    inputSchema: AiDiagnoseAppHealthInputSchema,
    outputSchema: AiDiagnoseAppHealthOutputSchema,
  },
  async input => {
    const model = googleAI('gemini-2.5-flash');
    const { output } = await ai.generate({
      model,
      prompt: prompt,
      input: input,
      output: { schema: AiDiagnoseAppHealthOutputSchema },
      config: {
        timeout: 30000,
      },
    });
    if (!output) {
      throw new Error(
        'AI failed to return a valid diagnosis. The output did not match the expected format.'
      );
    }
    return output;
  }
);
