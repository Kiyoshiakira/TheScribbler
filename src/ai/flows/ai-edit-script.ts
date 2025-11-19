'use server';
/**
 * @fileOverview An AI tool that intelligently edits screenplay content.
 *
 * - aiEditScript - A function that edits screenplay content based on user instructions.
 * - AiEditScriptInput - The input type for the function.
 * - AiEditScriptOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { getEditingPrompt } from '@/lib/ai-system-prompts';
import { enrichDocumentWithSemantics } from '@/lib/semantic-document-model';
import { getRelevantContext } from '@/lib/rag-service';

const ScriptBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot', 'centered', 'section', 'synopsis']),
  text: z.string(),
});

const AiEditScriptInputSchema = z.object({
  instruction: z.string().describe('The user instruction for how to edit the script (e.g., "fix spelling errors", "make the dialogue more natural", "improve the action description").'),
  targetText: z.string().optional().describe('Optional specific text to edit. If not provided, the AI will work with the entire context.'),
  context: z.array(ScriptBlockSchema).describe('The screenplay blocks that provide context for the edit.'),
  selectionStart: z.number().optional().describe('Start index of selected text within a block.'),
  selectionEnd: z.number().optional().describe('End index of selected text within a block.'),
});
export type AiEditScriptInput = z.infer<typeof AiEditScriptInputSchema>;

const EditSuggestionSchema = z.object({
  originalText: z.string().describe('The original text that should be replaced.'),
  editedText: z.string().describe('The improved/edited version of the text.'),
  reason: z.string().describe('Brief explanation of why this edit improves the script.'),
  confidence: z.enum(['high', 'medium', 'low']).describe('How confident the AI is in this suggestion.'),
});

const AiEditScriptOutputSchema = z.object({
  suggestions: z.array(EditSuggestionSchema).describe('List of editing suggestions.'),
  summary: z.string().describe('A brief summary of the edits made.'),
});
export type AiEditScriptOutput = z.infer<typeof AiEditScriptOutputSchema>;

export async function aiEditScript(
  input: AiEditScriptInput
): Promise<AiEditScriptOutput> {
  return aiEditScriptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'editScriptPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  config: {
    temperature: 0.3,
    systemInstruction: {
      parts: [{ text: getEditingPrompt(false) }], // Set to true if working with Skylantia
    },
  },
  input: { schema: AiEditScriptInputSchema },
  output: { schema: AiEditScriptOutputSchema },
  prompt: `**User Instruction:** {{{instruction}}}

**Context (Screenplay Blocks):**
{{{json context}}}

{{#if targetText}}
**Specific Text to Edit:** {{{targetText}}}
{{/if}}

Analyze the provided screenplay content and the user's instruction. Provide intelligent editing suggestions that:

1. **Fix errors**: Correct spelling, grammar, punctuation, and formatting issues
2. **Enhance clarity**: Make action lines more visual and clear
3. **Improve dialogue**: Ensure it sounds natural and reveals character
4. **Maintain voice**: Keep the writer's unique style and tone
5. **Follow format**: Adhere to standard screenplay formatting rules

For each suggestion:
- Provide the exact original text to replace
- Provide the improved version
- Explain WHY the edit improves the script
- Rate your confidence in the suggestion (high/medium/low)

**IMPORTANT RULES:**
- Only suggest changes that align with the user's instruction
- Preserve the writer's creative intent and voice
- If the text is well-written and the instruction doesn't apply, return an empty suggestions array
- Be surgical: only change what needs changing
- For spelling/grammar fixes, use HIGH confidence
- For creative improvements, use MEDIUM confidence unless you're certain
- If you're unsure, use LOW confidence

Return a summary explaining what types of edits you've suggested.`,
});

const aiEditScriptFlow = ai.defineFlow(
  {
    name: 'aiEditScriptFlow',
    inputSchema: AiEditScriptInputSchema,
    outputSchema: AiEditScriptOutputSchema,
  },
  async (input) => {
    // If context is too small, don't analyze
    if (input.context.length === 0) {
      return {
        suggestions: [],
        summary: 'No content provided to edit.',
      };
    }

    const { output } = await prompt(input);
    if (!output) {
      throw new Error(
        'AI failed to return valid editing suggestions. The output did not match the expected format.'
      );
    }
    return output;
  }
);
