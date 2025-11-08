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
  characterName: z
    .string()
    .optional()
    .describe('The character name already provided by the user (if any). Use this name instead of generating a new one.'),
  existingProfile: z
    .string()
    .optional()
    .describe('Any existing character profile text. Build upon this rather than replacing it.'),
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
    name: 'generateCharacterProfilePrompt',
    model: googleAI.model('gemini-2.5-flash'),
    config: {
        temperature: 0.7,
    },
    input: { schema: AiGenerateCharacterProfileInputSchema },
    output: { schema: AiGenerateCharacterProfileOutputSchema },
    prompt: `You are an expert screenwriter and character creator with deep understanding of character development and narrative coherence.

  Your task is to generate or enhance a detailed character profile, respecting any context already provided by the user.

  **Character Description:**
  \`\`\`
  {{{characterDescription}}}
  \`\`\`

  {{#if characterName}}
  **User-Provided Character Name:**
  The user has already chosen the name "{{{characterName}}}" for this character. You MUST use this exact name. Do NOT generate a different name.
  {{else}}
  **Character Name:**
  Create a plausible and memorable full name that fits the character description.
  {{/if}}

  {{#if existingProfile}}
  **Existing Profile (User's Work in Progress):**
  \`\`\`
  {{{existingProfile}}}
  \`\`\`
  
  **Your Task:** Carefully read the existing profile above. Build upon it, expand it, and enhance it while preserving the user's creative choices and voice. Do NOT replace their work - instead, enrich and complete it. Fill in missing elements and add depth while maintaining consistency with what they've already written.
  {{else}}
  **Your Task:** Write a rich, narrative-style character profile from scratch.
  {{/if}}

  **Profile Requirements:**
  Your character profile should include these elements (whether creating new or enhancing existing):
  -   **Backstory:** Key life events and formative experiences that shaped who they are.
  -   **Personality:** Core traits, strengths, flaws, and contradictions that make them complex and believable.
  -   **Motivations:** Their primary goals, desires, and what drives them forward.
  -   **Fears:** What they are most afraid of, both physically and emotionally.
  -   **Quirks:** Interesting habits, mannerisms, or unique characteristics that make them memorable.
  -   **Relationships:** How they relate to others and their social dynamics.

  **Writing Style:**
  - Write in an engaging, narrative style that brings the character to life
  - Be specific and concrete rather than generic
  - Create depth and nuance - avoid one-dimensional characters
  - Ensure internal consistency and logical coherence
  - Make the character feel real and compelling

  {{#if existingProfile}}
  Remember: Respect and build upon the user's existing work. Match their tone and style.
  {{/if}}
  `,
});

const aiGenerateCharacterProfileFlow = ai.defineFlow(
  {
    name: 'aiGenerateCharacterProfileFlow',
    inputSchema: AiGenerateCharacterProfileInputSchema,
    outputSchema: AiGenerateCharacterProfileOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to return a valid character profile. The output did not match the expected format.');
    }
    return output;
  }
);
