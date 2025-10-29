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
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { adminApp } from '@/firebase/admin';


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

export async function saveCharacter(
  userId: string,
  scriptId: string,
  characterId: string | undefined,
  characterData: {
    name: string;
    description: string;
    profile?: string;
    imageUrl?: string;
    scenes: number;
  }
) {
  if (!adminApp) {
    const errorMessage = 'Firebase Admin SDK is not initialized. Character cannot be saved.';
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const db = getFirestore(adminApp);
    const charactersCollectionRef = db.collection(`users/${userId}/scripts/${scriptId}/characters`);
    const serverTimestamp = FieldValue.serverTimestamp();

    if (characterId) {
      const charDocRef = charactersCollectionRef.doc(characterId);
      await charDocRef.set(
        {
          ...characterData,
          updatedAt: serverTimestamp,
        },
        { merge: true }
      );
      return { success: true, id: characterId };
    } else {
      const newCharDocRef = await charactersCollectionRef.add({
        ...characterData,
        createdAt: serverTimestamp,
        updatedAt: serverTimestamp,
      });
      return { success: true, id: newCharDocRef.id };
    }
  } catch (error) {
    console.error('Error saving character:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}

export async function updateUserProfile(
  userId: string,
  data: { bio: string, coverImageUrl: string }
) {
  if (!adminApp) {
    const errorMessage = 'Firebase Admin SDK is not initialized. Profile cannot be updated.';
    console.error(errorMessage);
    return { success: false, error: errorMessage };
  }

  try {
    const db = getFirestore(adminApp);
    const userDocRef = db.collection('users').doc(userId);
    
    await userDocRef.set(
      {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, error: errorMessage };
  }
}
