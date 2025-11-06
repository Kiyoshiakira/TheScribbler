'use server';
/**
 * @fileOverview An AI tool that provides writing assistance and auto-complete suggestions.
 *
 * - aiWritingAssist - A function that provides writing suggestions for screenplays.
 * - AiWritingAssistInput - The input type for the function.
 * - AiWritingAssistOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const ScriptBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot', 'centered', 'section', 'synopsis']),
  text: z.string(),
});

const AiWritingAssistInputSchema = z.object({
  currentBlock: ScriptBlockSchema.describe('The block currently being edited.'),
  cursorPosition: z.number().describe('Current cursor position in the block text.'),
  precedingBlocks: z.array(ScriptBlockSchema).describe('Previous blocks for context.'),
  assistType: z.enum(['complete', 'suggest', 'continue']).describe('Type of assistance: complete (auto-complete current sentence), suggest (suggest next line), continue (continue the scene/dialogue)'),
});
export type AiWritingAssistInput = z.infer<typeof AiWritingAssistInputSchema>;

const WritingSuggestionSchema = z.object({
  suggestion: z.string().describe('The suggested text to insert or complete.'),
  type: z.enum(['completion', 'next-line', 'continuation']).describe('Type of suggestion.'),
  confidence: z.number().min(0).max(1).describe('Confidence score 0-1.'),
});

const AiWritingAssistOutputSchema = z.object({
  suggestions: z.array(WritingSuggestionSchema).describe('List of writing suggestions, ordered by relevance.'),
});
export type AiWritingAssistOutput = z.infer<typeof AiWritingAssistOutputSchema>;

export async function aiWritingAssist(
  input: AiWritingAssistInput
): Promise<AiWritingAssistOutput> {
  return aiWritingAssistFlow(input);
}

const prompt = ai.definePrompt({
  name: 'writingAssistPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  config: {
    temperature: 0.7,
  },
  input: { schema: AiWritingAssistInputSchema },
  output: { schema: AiWritingAssistOutputSchema },
  prompt: `You are an expert screenwriting co-writer providing intelligent writing assistance.

**Context (Previous Blocks):**
{{{json precedingBlocks}}}

**Current Block:**
Type: {{{currentBlock.type}}}
Text: {{{currentBlock.text}}}
Cursor Position: {{{cursorPosition}}}

**Assistance Type:** {{{assistType}}}

Based on the context and current editing position, provide intelligent writing suggestions:

**For 'complete' (auto-complete):**
- Complete the current sentence or phrase naturally
- Match the tone and style of existing content
- Follow screenplay formatting conventions
- Provide 1-3 completion options

**For 'suggest' (next line):**
- Suggest what should come next based on context
- Consider the block type (if CHARACTER, suggest dialogue; if ACTION, suggest action, etc.)
- Maintain story continuity and character voice
- Provide 2-3 suggestions

**For 'continue' (continue scene):**
- Suggest how to continue the current scene or dialogue
- Maintain pacing and dramatic tension
- Keep character voices consistent
- Provide 1-2 substantial continuation suggestions

**Guidelines:**
- Be concise and relevant
- Match the writer's style and tone
- Follow industry-standard screenplay formatting
- Assign higher confidence (0.8-1.0) to obvious continuations
- Assign medium confidence (0.5-0.7) to creative suggestions
- Assign lower confidence (0.3-0.5) to speculative ideas
- If context is insufficient, return empty suggestions array

Return suggestions ordered by relevance and confidence.`,
});

const aiWritingAssistFlow = ai.defineFlow(
  {
    name: 'aiWritingAssistFlow',
    inputSchema: AiWritingAssistInputSchema,
    outputSchema: AiWritingAssistOutputSchema,
  },
  async (input) => {
    // Need at least some context to provide suggestions
    if (!input.currentBlock.text && input.precedingBlocks.length === 0) {
      return { suggestions: [] };
    }

    const { output } = await prompt(input);
    if (!output) {
      return { suggestions: [] };
    }
    return output;
  }
);
