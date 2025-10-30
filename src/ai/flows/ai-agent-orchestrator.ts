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
  script: z.string().describe('The current state of the screenplay.'),
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
  modifiedScript: z
    .string()
    .optional()
    .describe(
      'The full, rewritten script content if the user requested a change.'
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
    description: 'Generates a new character profile based on a user description. Use this when the user explicitly asks to create, make, or generate a character.',
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
        description: 'Proofreads the script for objective errors like spelling, grammar, and continuity mistakes. This tool does NOT change the story or structure.',
        inputSchema: z.object({
            script: z.string().describe('The full script to proofread.'),
        }),
        outputSchema: AiProofreadScriptOutputSchema,
    },
    async ({script}): Promise<AiProofreadScriptOutput> => {
        return await aiProofreadScript({ script });
    }
);

const reformatScriptTool = ai.defineTool(
    {
        name: 'reformatScript',
        description: 'Reformats the entire script into standard screenplay format. Use this when the user asks to "reformat", "clean up", "fix formatting", or says the script is "squished" or "unstructured".',
        inputSchema: z.object({
            script: z.string().describe('The full script content to reformat.'),
        }),
        outputSchema: AiReformatScriptOutputSchema,
    },
     async ({script}): Promise<AiReformatScriptOutput> => {
        return await aiReformatScript({ rawScript: script });
    }
);

const orchestratorPrompt = `You are an expert AI assistant for a screenwriting application. Your primary goal is to help the user modify their script and other project elements by correctly choosing an action.

Analyze the user's request and the current script content to determine the correct action. You have two types of actions: direct script modification or calling a tool.

**HIGHEST PRIORITY: DIRECT SCRIPT MODIFICATION**
- **IF the user asks for a direct change to the story or dialogue (e.g., "change the character's name", "make this scene more suspenseful", "add a line of dialogue")**, you MUST rewrite the script yourself.
- In this case, **DO NOT CALL A TOOL**. Your action is to provide the full new script content in the 'modifiedScript' field of your response.

**SECOND PRIORITY: TOOL CALLING**
If the request is not a direct story change, you MUST select one of the following tools:
- **IF the user asks to create a character**, use the \`generateCharacter\` tool.
- **IF the user asks to proofread, check for errors, or find mistakes**, use the \`proofreadScript\` tool.
- **IF the user asks to reformat, clean up the layout, or fix formatting (e.g., "it's too squished")**, use the \`reformatScript\` tool.

**LOWEST PRIORITY: GENERAL CONVERSATION**
- **IF the user is asking a general question or for analysis that doesn't fit any of the above**, respond directly with text and do not use a tool or modify the script.

**User Request:**
{{{request}}}

**Current Screenplay:**
---
{{{script}}}
---
`;


// Define a prompt for the decision-making step with tools
const decisionPrompt = ai.definePrompt({
  name: 'aiAgentOrchestratorDecisionPrompt',
  input: { schema: AiAgentOrchestratorInputSchema },
  tools: [generateCharacterTool, proofreadScriptTool, reformatScriptTool],
  output: {
    format: 'json',
    schema: z.object({
      modifiedScript: z
        .string()
        .optional()
        .describe(
          "If the request requires a direct script change, this is the FULL new script. Omit this field entirely if calling a tool."
        ),
    }),
  },
  prompt: orchestratorPrompt,
});

// Define a prompt for the final response
const finalResponsePrompt = ai.definePrompt({
  name: 'aiAgentOrchestratorFinalResponsePrompt',
  input: {
    schema: z.object({
      request: z.string(),
      toolResult: z.any(),
    }),
  },
  output: {
    format: 'json',
    schema: z.object({
      response: z.string().describe("The AI's friendly, conversational response to the user, summarizing the action taken."),
    }),
  },
  prompt: `You are an expert AI assistant. Based on the user's request, an action was just performed.
  - If a script was modified, state that you've made the requested changes to the script.
  - If a character was generated, present the character.
  - If proofreading was done, summarize what you found.
  - If reformatting was done, confirm it.

  Keep your response concise and friendly.

  User Request: "{{{request}}}"
  Action Result: {{{toolResult}}}
  `,
});

// Define a prompt for general questions
const generalResponsePrompt = ai.definePrompt({
  name: 'aiAgentOrchestratorGeneralResponsePrompt',
  input: { schema: AiAgentOrchestratorInputSchema },
  prompt: `You are an expert AI assistant. The user asked: "{{{request}}}". The script content is: ---{{{script}}}---. Provide a helpful, conversational answer to their question.`,
});

const aiAgentOrchestratorFlow = ai.defineFlow(
  {
    name: 'aiAgentOrchestratorFlow',
    inputSchema: AiAgentOrchestratorInputSchema,
    outputSchema: AiAgentOrchestratorOutputSchema,
  },
  async (input) => {
    // STEP 1: Let the model decide whether to call a tool OR modify the script directly.
    const decision = await decisionPrompt(input);

    let toolResult: any = null;
    let modifiedScript = decision.output?.modifiedScript;

    // STEP 2: Execute the chosen tool, if any.
    if (decision.toolRequests && decision.toolRequests.length > 0) {
        const part = decision.toolRequests[0];
        const toolRequestData = part.toolRequest;
        if (!toolRequestData) {
            throw new Error('Tool request data is missing');
        }
        const toolOutput = await (part as any).run();
        
        let toolType: string | null = null;
        if (toolRequestData.name === 'generateCharacter') toolType = 'character';
        if (toolRequestData.name === 'proofreadScript') toolType = 'proofread';
        if (toolRequestData.name === 'reformatScript') {
             toolType = 'reformat';
             modifiedScript = (toolOutput as AiReformatScriptOutput).formattedScript;
        }

        toolResult = {
            type: toolType,
            data: toolOutput,
        };
    }
    
    // STEP 3: Generate the final conversational response based on the action taken.
    if (modifiedScript || toolResult) {
        const finalResponse = await finalResponsePrompt({
            request: input.request,
            toolResult: JSON.stringify(toolResult || { action: 'Direct Script Modification' }),
        });
        
        return {
            response: finalResponse.output?.response || "I've completed your request.",
            modifiedScript: modifiedScript,
            toolResult: toolResult,
        };
    }

    // STEP 4: If no tool was called and no script was modified, it's a general question.
    const generalResponse = await generalResponsePrompt(input);

    return {
      response: generalResponse.text,
    };
  }
);
