'use server';

import {
  aiSuggestSceneImprovements,
  type AiSuggestSceneImprovementsInput,
} from '@/ai/flows/ai-suggest-scene-improvements';
import {
  aiDeepAnalysis,
  type AiDeepAnalysisInput,
} from '@/ai/flows/ai-deep-analysis';
import {
  aiAgentOrchestrator,
  type AiAgentOrchestratorInput,
} from '@/ai/flows/ai-agent-orchestrator';
import {
  aiProofreadScript,
  type AiProofreadScriptInput,
} from '@/ai/flows/ai-proofread-script';
import {
    aiGenerateCharacterProfile,
    type AiGenerateCharacterProfileInput,
} from '@/ai/flows/ai-generate-character-profile';
import {
    aiGenerateNote as aiGenerateNoteFlow,
    type AiGenerateNoteInput,
} from '@/ai/flows/ai-generate-note';
import {
    aiGenerateLogline as aiGenerateLoglineFlow,
    type AiGenerateLoglineInput,
} from '@/ai/flows/ai-generate-logline';

const SCRIPT_TOKEN_LIMIT = 1000000; // 1 million characters

export async function getAiSuggestions(
  input: AiSuggestSceneImprovementsInput
) {
  if (!process.env.GEMINI_API_KEY) {
    return { data: null, error: 'GEMINI_API_KEY is not set. Please create a .env.local file and add your key.' };
  }
  try {
    const result = await aiSuggestSceneImprovements(input);
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `An error occurred while fetching AI suggestions: ${errorMessage}`,
    };
  }
}

export async function aiGenerateLogline(input: AiGenerateLoglineInput) {
    if (!process.env.GEMINI_API_KEY) {
        return { data: null, error: 'GEMINI_API_KEY is not set. Please create a .env.local file and add your key.' };
    }
    try {
        const result = await aiGenerateLoglineFlow(input);
        return { data: result, error: null };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return {
        data: null,
        error: `An error occurred while generating the logline: ${errorMessage}`,
        };
    }
}

export async function getAiCharacterProfile(input: AiGenerateCharacterProfileInput) {
    if (!process.env.GEMINI_API_KEY) {
        return { data: null, error: 'GEMINI_API_KEY is not set. Please create a .env.local file and add your key.' };
    }
    try {
        const result = await aiGenerateCharacterProfile(input);
        return { data: result, error: null };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return {
        data: null,
        error: `An error occurred while generating the character profile: ${errorMessage}`,
        };
    }
}

export async function aiGenerateNote(input: AiGenerateNoteInput) {
    if (!process.env.GEMINI_API_KEY) {
        return { data: null, error: 'GEMINI_API_KEY is not set. Please create a .env.local file and add your key.' };
    }
    try {
        const result = await aiGenerateNoteFlow(input);
        return { data: result, error: null };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return {
        data: null,
        error: `An error occurred while generating the note: ${errorMessage}`,
        };
    }
}


export async function getAiDeepAnalysis(input: AiDeepAnalysisInput) {
  if (!process.env.GEMINI_API_KEY) {
    return { data: null, error: 'GEMINI_API_KEY is not set. Please create a .env.local file and add your key.' };
  }
  try {
    const result = await aiDeepAnalysis(input);
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `An error occurred while fetching the deep analysis: ${errorMessage}`,
    };
  }
}

export async function runAiAgent(input: AiAgentOrchestratorInput) {
    if (!process.env.GEMINI_API_KEY) {
        return { data: null, error: 'GEMINI_API_KEY is not set. Please create a .env.local file and add your key.' };
    }
    try {
        const result = await aiAgentOrchestrator(input);
        return { data: result, error: null };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return {
        data: null,
        error: `An error occurred while running the AI agent: ${errorMessage}`,
        };
    }
}

export async function getAiProofreadSuggestions(input: AiProofreadScriptInput) {
    if (!process.env.GEMINI_API_KEY) {
        return { data: null, error: 'GEMINI_API_KEY is not set. Please create a .env.local file and add your key.' };
    }
    // Prevent calling the flow if the script is too long.
    if (input.script.length > SCRIPT_TOKEN_LIMIT) {
        return {
          data: null,
          error: `The script is too long for the proofreader. Please reduce its length and try again. (Limit: ${SCRIPT_TOKEN_LIMIT} characters)`,
        };
    }
    try {
        const result = await aiProofreadScript(input);
        return { data: result, error: null };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return {
        data: null,
        error: `An error occurred while proofreading: ${errorMessage}`,
        };
    }
}
