'use server';
/**
 * @fileOverview The main AI agent orchestrator.
 * This flow is responsible for interpreting user requests and dispatching them to the appropriate tools or sub-flows.
 *
 * - aiAgentOrchestrator - The main function that orchestrates the AI agent's response.
 * - AiAgentOrchestratorInput - The input type for the function.
 * - AiAgentOrchestratorOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import {
  aiGenerateCharacterProfile,
  type AiGenerateCharacterProfileOutput,
} from './ai-generate-character-profile';
import {
  aiProofreadScript,
  type AiProofreadScriptOutput,
} from './ai-proofread-script';
import {
  aiReformatScript,
  type AiReformatScriptOutput,
} from './ai-reformat-script';
import { ScriptBlock, ScriptDocument } from '@/lib/editor-types';


const ScriptBlockSchema = z.object({
  id: z.string(),
  type: z.enum(['scene-heading', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'shot']),
  text: z.string(),
});

const ScriptDocumentSchema = z.object({
  blocks: z.array(ScriptBlockSchema),
});


const AiGenerateCharacterProfileOutputSchema = z.object({
  name: z.string().describe("The character's full name."),
  profile: z
    .string()
    .describe(
      'A detailed character profile that includes backstory, personality, motivations, and quirks.'
    ),
});

const AiProofreadScriptOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      originalText: z.string(),
      correctedText: z.string(),
      explanation: z.string(),
    })
  ),
});

const AiReformatScriptOutputSchema = z.object({
  formattedScript: z.string(),
});

const AiAgentOrchestratorInputSchema = z.object({
  request: z.string().describe("The user's natural language request."),
  document: ScriptDocumentSchema.describe('The current state of the screenplay as a structured document.'),
});
export type AiAgentOrchestratorInput = z.infer<
  typeof AiAgentOrchestratorInputSchema
>;

const AiAgentOrchestratorOutputSchema = z.object({
  response: z
    .string()
    .describe(
      "The AI's response to the user's request, which may include the results of tool calls."
    ),
  toolResult: z
    .any()
    .optional()
    .describe('The direct result from any tool that was called.'),
  modifiedDocument: ScriptDocumentSchema
    .optional()
    .describe(
      'The full, rewritten script document if the user requested a change.'
    ),
});
export type AiAgentOrchestratorOutput = z.infer<
  typeof AiAgentOrchestratorOutputSchema
>;

export async function aiAgentOrchestrator(
  input: AiAgentOrchestratorInput
): Promise<AiAgentOrchestratorOutput> {
  return aiAgentOrchestratorFlow(input);
}

// Define tools separately
const generateCharacterTool = ai.defineTool(
  {
    name: 'generateCharacter',
    description:
      'Generates a new character profile based on a user description. Use this when the user explicitly asks to create, make, or generate a character.',
    inputSchema: z.object({
      description: z
        .string()
        .describe('A brief description of the character to be created.'),
    }),
    outputSchema: AiGenerateCharacterProfileOutputSchema,
  },
  async (toolInput): Promise<AiGenerateCharacterProfileOutput> => {
    return await aiGenerateCharacterProfile({
      characterDescription: toolInput.description,
    });
  }
);

const proofreadScriptTool = ai.defineTool(
  {
    name: 'proofreadScript',
    description:
      'Proofreads the script for objective errors like spelling, grammar, and continuity mistakes. This tool does NOT change the story or structure.',
    inputSchema: z.object({
      script: z.string().describe('The full script content to proofread.'),
    }),
    outputSchema: AiProofreadScriptOutputSchema,
  },
  async ({ script }): Promise<AiProofreadScriptOutput> => {
    return await aiProofreadScript({ script });
  }
);

const reformatScriptTool = ai.defineTool(
  {
    name: 'reformatScript',
    description:
      'Reformats the entire script into standard screenplay format. Use this when the user asks to "reformat", "clean up", "fix formatting", or says the script is "squished" or "unstructured". This returns a single text string, not a document.',
    inputSchema: z.object({
      script: z.string().describe('The full script content to reformat.'),
    }),
    outputSchema: AiReformatScriptOutputSchema,
  },
  async ({ script }): Promise<AiReformatScriptOutput> => {
    return await aiReformatScript({ rawScript: script });
  }
);

const orchestratorPrompt = `You are an expert AI assistant for a screenwriting application. Your primary goal is to help the user modify their script and other project elements by correctly choosing an action.

Analyze the user's request and the current script content to determine the correct action. You have two types of actions: direct script modification or calling a tool.

**HIGHEST PRIORITY: DIRECT SCRIPT MODIFICATION**
- **IF the user asks for a direct change to the story, dialogue, characters, or scenes (e.g., "change the character's name", "make this scene more suspenseful", "add a line of dialogue", "delete the last action line")**, you MUST rewrite the script's document structure.
- In this case, **DO NOT CALL A TOOL**. Your action is to provide the full new script document in the 'modifiedDocument' field of your response.
- You MUST preserve the existing block IDs where possible. Only generate new IDs for new blocks.

**SECOND PRIORITY: TOOL CALLING**
If the request is not a direct story change, you MUST select one of the following tools:
- **IF the user asks to create a brand new character profile (not editing an existing one)**, use the \`generateCharacter\` tool.
- **IF the user asks to proofread, check for errors, or find mistakes**, use the \`proofreadScript\` tool.
- **IF the user asks to reformat, clean up the layout, or fix formatting from a raw text block (e.g., "it's too squished")**, use the \`reformatScript\` tool.

**LOWEST PRIORITY: GENERAL CONVERSATION**
- **IF the user is asking a general question or for analysis that doesn't fit any of the above**, respond directly with text and do not use a tool or modify the script document.

**User Request:**
{{{request}}}

**Current Screenplay Document:**
---
{{{json document}}}
---
`;

const aiAgentOrchestratorFlow = ai.defineFlow(
  {
    name: 'aiAgentOrchestratorFlow',
    inputSchema: AiAgentOrchestratorInputSchema,
    outputSchema: AiAgentOrchestratorOutputSchema,
  },
  async (input) => {
    const model = googleAI.model('gemini-2.5-flash');
    const scriptAsString = JSON.stringify(input.document);

    // STEP 1: Let the model decide whether to call a tool OR modify the script directly.
    let decision = await ai.generate({
      model,
      prompt: orchestratorPrompt,
      history: [{role: 'user', content: [{text: input.request}, {json: input.document}]}],
      tools: [generateCharacterTool, proofreadScriptTool, reformatScriptTool],
      output: {
        format: 'json',
        schema: z.object({
          modifiedDocument: ScriptDocumentSchema
            .optional()
            .describe(
              'If the request requires a direct script change, this is the FULL new script document. Omit this field entirely if calling a tool.'
            ),
        }),
      },
      config: {
        temperature: 0.1,
      }
    });

    let toolResult: any = null;
    let modifiedDocument = decision.output?.modifiedDocument;
    let modifiedScriptAsString: string | undefined = undefined;

    // STEP 2: Execute the chosen tool, if any.
    if (decision.toolRequests.length > 0) {
      const toolRequest = decision.toolRequests[0];
      const toolOutput = await toolRequest.run();

      let toolType: string | null = null;
      if (toolRequest.name === 'generateCharacter') toolType = 'character';
      if (toolRequest.name === 'proofreadScript') toolType = 'proofread';
      if (toolRequest.name === 'reformatScript') {
        toolType = 'reformat';
        // The output of reformat is a string, not a document.
        modifiedScriptAsString = (toolOutput as AiReformatScriptOutput)
          .formattedScript;
      }

      toolResult = {
        type: toolType,
        data: toolOutput,
      };
    }

    // STEP 3: Generate the final conversational response based on the action taken.
    if (modifiedDocument || toolResult) {
      const finalResponse = await ai.generate({
        model,
        prompt: `You are an expert AI assistant. Based on the user's request, an action was just performed.
            - If a script was modified, state that you've made the requested changes to the script.
            - If a character was generated, present the character.
            - If proofreading was done, summarize what you found.
            - If reformatting was done, confirm it.

            Keep your response concise and friendly.

            User Request: "${input.request}"
            Action Result: ${JSON.stringify(
              toolResult || { action: 'Direct Script Modification' }
            )}
            `,
        output: {
          format: 'json',
          schema: z.object({
            response: z
              .string()
              .describe(
                "The AI's friendly, conversational response to the user, summarizing the action taken."
              ),
          }),
        },
        config: {
            temperature: 0.3,
        }
      });
      
      // Special handling for reformat tool which returns a string, not a document
      if (modifiedScriptAsString) {
         return {
            response:
            finalResponse.output?.response || "I've completed your request.",
            // We need to parse the string back into a document here.
            modifiedDocument: { blocks: modifiedScriptAsString.split('\n\n').map((line, index) => ({ id: `block-${index}-${Date.now()}`, text: line, type: 'action' as const }))},
            toolResult: toolResult,
        };
      }

      return {
        response:
          finalResponse.output?.response || "I've completed your request.",
        modifiedDocument: modifiedDocument,
        toolResult: toolResult,
      };
    }

    // STEP 4: If no tool was called and no script was modified, it's a general question.
    const generalResponse = await ai.generate({
      model,
      prompt: `You are an expert AI assistant. The user asked: "${input.request}". The script content is: ---${scriptAsString}---. Provide a helpful, conversational answer to their question.`,
      history: [{role: 'user', content: [{text: input.request}, {json: input.document}]}],
    });

    return {
      response: generalResponse.text,
    };
  }
);

    