'use server';

/**
 * Server actions for AI Helper operations
 * 
 * These actions bridge the client UI with the AI provider abstraction layer.
 */

import { getActiveProvider } from '@/services/aiProviderRegistry';
import { AiContext } from '@/services/aiProvider';

/**
 * Provider status information
 */
export interface AiProviderStatus {
  isConfigured: boolean;
  providerName: string;
  usageCount: number;
  usageLimit: number;
  remainingUsage: number;
}

/**
 * Get current AI provider status
 */
export async function getAiProviderStatus(): Promise<AiProviderStatus> {
  const provider = getActiveProvider();

  if (!provider || !provider.isConfigured()) {
    return {
      isConfigured: false,
      providerName: 'None',
      usageCount: 0,
      usageLimit: 0,
      remainingUsage: 0,
    };
  }

  return {
    isConfigured: true,
    providerName: provider.getName(),
    usageCount: provider.getUsageCount(),
    usageLimit: provider.getUsageLimit(),
    remainingUsage: provider.getRemainingUsage(),
  };
}

/**
 * Rewrite text with AI
 */
export async function runAiHelperRewrite(input: {
  text: string;
  style?: string;
  tone?: string;
  precedingText?: string;
  followingText?: string;
}) {
  const provider = getActiveProvider();

  if (!provider || !provider.isConfigured()) {
    return {
      data: null,
      error: 'AI provider is not configured. Please set your API key in settings.',
    };
  }

  try {
    const context: AiContext = {
      text: input.text,
      precedingText: input.precedingText,
      followingText: input.followingText,
      documentType: 'other',
    };

    const result = await provider.rewrite(context, {
      style: input.style,
      tone: input.tone,
    });

    return { data: result, error: null };
  } catch (error) {
    console.error('[runAiHelperRewrite] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `Failed to rewrite text: ${errorMessage}`,
    };
  }
}

/**
 * Continue/complete text with AI
 */
export async function runAiHelperContinue(input: {
  text: string;
  maxLength?: number;
  style?: string;
  precedingText?: string;
}) {
  const provider = getActiveProvider();

  if (!provider || !provider.isConfigured()) {
    return {
      data: null,
      error: 'AI provider is not configured. Please set your API key in settings.',
    };
  }

  try {
    const context: AiContext = {
      text: input.text,
      precedingText: input.precedingText,
      documentType: 'other',
    };

    const result = await provider.continue(context, {
      maxLength: input.maxLength,
      style: input.style,
    });

    return { data: result, error: null };
  } catch (error) {
    console.error('[runAiHelperContinue] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `Failed to continue text: ${errorMessage}`,
    };
  }
}

/**
 * Summarize text with AI
 */
export async function runAiHelperSummarize(input: {
  text: string;
  format?: 'paragraph' | 'bullets' | 'brief';
  targetLength?: number;
}) {
  const provider = getActiveProvider();

  if (!provider || !provider.isConfigured()) {
    return {
      data: null,
      error: 'AI provider is not configured. Please set your API key in settings.',
    };
  }

  try {
    const context: AiContext = {
      text: input.text,
      documentType: 'other',
    };

    const result = await provider.summarize(context, {
      format: input.format,
      targetLength: input.targetLength,
    });

    return { data: result, error: null };
  } catch (error) {
    console.error('[runAiHelperSummarize] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `Failed to summarize text: ${errorMessage}`,
    };
  }
}

/**
 * Expand text/bullets with AI
 */
export async function runAiHelperExpand(input: {
  text: string;
  expansionFactor?: number;
  focusAreas?: string[];
  precedingText?: string;
}) {
  const provider = getActiveProvider();

  if (!provider || !provider.isConfigured()) {
    return {
      data: null,
      error: 'AI provider is not configured. Please set your API key in settings.',
    };
  }

  try {
    const context: AiContext = {
      text: input.text,
      precedingText: input.precedingText,
      documentType: 'other',
    };

    const result = await provider.expand(context, {
      expansionFactor: input.expansionFactor,
      focusAreas: input.focusAreas,
    });

    return { data: result, error: null };
  } catch (error) {
    console.error('[runAiHelperExpand] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return {
      data: null,
      error: `Failed to expand text: ${errorMessage}`,
    };
  }
}
