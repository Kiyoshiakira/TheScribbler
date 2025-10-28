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


export async function getAiSuggestions(
  input: AiSuggestSceneImprovementsInput
) {
  try {
    const result = await aiSuggestSceneImprovements(input);
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: 'An error occurred while fetching AI suggestions.',
    };
  }
}

// This legacy function is no longer needed as the agent orchestrator handles it.
// We will remove it in a future step.
export async function getAiCharacterProfile() {
  return { data: null, error: 'This function is deprecated.' };
}


export async function getAiDeepAnalysis(input: AiDeepAnalysisInput) {
  try {
    const result = await aiDeepAnalysis(input);
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: 'An error occurred while fetching the deep analysis.',
    };
  }
}

export async function runAiAgent(input: AiAgentOrchestratorInput) {
    try {
        const result = await aiAgentOrchestrator(input);
        return { data: result, error: null };
    } catch (error) {
        console.error(error);
        return {
        data: null,
        error: 'An error occurred while running the AI agent.',
        };
    }
}
