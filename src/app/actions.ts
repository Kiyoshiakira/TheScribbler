'use server';

import {
  aiSuggestSceneImprovements,
  type AiSuggestSceneImprovementsInput,
} from '@/ai/flows/ai-suggest-scene-improvements';
import {
  generateCharacterProfiles,
  type GenerateCharacterProfilesInput,
  type GenerateCharacterProfilesOutput,
} from '@/ai/flows/ai-generate-character-profiles';
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

export async function getAiCharacterProfile(
  input: GenerateCharacterProfilesInput
): Promise<{ data: GenerateCharacterProfilesOutput | null, error: string | null }> {
  try {
    const result = await generateCharacterProfiles(input);
    return { data: result, error: null };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: 'An error occurred while generating the character profile.',
    };
  }
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
