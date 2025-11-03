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
import {
    aiReformatScript,
    type AiReformatScriptInput,
} from '@/ai/flows/ai-reformat-script';
import {
  aiDiagnoseAppHealth,
  type AiDiagnoseAppHealthInput,
} from '@/ai/flows/ai-diagnose-app-health';
import { isAiAvailable } from '@/ai/genkit';


export async function runAiReformatScript(input: AiReformatScriptInput) {
    // Short-circuit if AI unavailable (missing API key / plugin). Allow import to continue
    // by returning the raw script as the formattedScript with a debug fallback indicator.
    if (!isAiAvailable) {
        return {
            data: { formattedScript: input.rawScript, __debug: { fallback: true, reason: 'GEMINI_API_KEY not set' } },
            error: null,
        };
    }

    try {
        const result = await aiReformatScript(input);
        // Validate shape defensively
        if (!result || typeof result.formattedScript !== 'string') {
            return { data: null, error: 'AI returned an unexpected output shape (formattedScript missing or invalid).' };
        }
        return { data: result, error: null };
    } catch (error) {
        console.error('[runAiReformatScript] Error invoking AI flow:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return {
            data: null,
            error: `An error occurred while reformatting the script: ${errorMessage}`,
        };
    }
}

export async function runGetAiSuggestions(
  input: AiSuggestSceneImprovementsInput
) {
  if (!isAiAvailable) {
    return { data: null, error: 'AI features are disabled. Please set your GEMINI_API_KEY.' };
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

export async function runAiGenerateLogline(input: AiGenerateLoglineInput) {
    if (!isAiAvailable) {
        return { data: null, error: 'AI features are disabled. Please set your GEMINI_API_KEY.' };
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

export async function runGetAiCharacterProfile(input: AiGenerateCharacterProfileInput) {
    if (!isAiAvailable) {
        return { data: null, error: 'AI features are disabled. Please set your GEMINI_API_KEY.' };
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

export async function runAiGenerateNote(input: AiGenerateNoteInput) {
    if (!isAiAvailable) {
        return { data: null, error: 'AI features are disabled. Please set your GEMINI_API_KEY.' };
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


export async function runGetAiDeepAnalysis(input: AiDeepAnalysisInput) {
  if (!isAiAvailable) {
    return { data: null, error: 'AI features are disabled. Please set your GEMINI_API_KEY.' };
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
    if (!isAiAvailable) {
        return { data: null, error: 'AI features are disabled. Please set your GEMINI_API_KEY.' };
    }
    try {
        const result = await aiAgentOrchestrator(input);
        return { data: result, error: null };
    } catch (error: any) {
        console.error('Error in runAiAgent:', error);
        const errorMessage = error.message || 'An unknown error occurred while running the AI agent.';
        return {
            data: null,
            error: errorMessage,
        };
    }
}


export async function runGetAiProofreadSuggestions(input: AiProofreadScriptInput) {
    if (!isAiAvailable) {
        return { data: null, error: 'AI features are disabled. Please set your GEMINI_API_KEY.' };
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

export async function runAiDiagnoseAppHealth(input: AiDiagnoseAppHealthInput) {
    if (!isAiAvailable) {
        return { data: { diagnosis: "AI Health Check disabled: GEMINI_API_KEY is not set." }, error: null };
    }
    try {
        const result = await aiDiagnoseAppHealth(input);
        return { data: result, error: null };
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return {
            data: null,
            error: `An error occurred during AI health diagnosis: ${errorMessage}`,
        };
    }
}

    