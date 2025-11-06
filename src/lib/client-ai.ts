/**
 * Client-side AI availability helper
 * 
 * This module provides utilities to detect whether AI features are enabled
 * in the client-side application by checking the NEXT_PUBLIC_AI_ENABLED
 * environment variable.
 */

/**
 * Helper function to get the AI enabled flag from environment variables.
 * Exported separately for testability.
 * 
 * @returns The value of NEXT_PUBLIC_AI_ENABLED environment variable
 */
export function getAiEnabledFlag(): string | undefined {
  return process.env.NEXT_PUBLIC_AI_ENABLED;
}

/**
 * Check if AI features are enabled in the application.
 * 
 * This reads the NEXT_PUBLIC_AI_ENABLED environment variable which is set
 * in next.config.ts based on whether GEMINI_API_KEY is configured.
 * 
 * @returns true if AI features are enabled, false otherwise
 */
export function isAiEnabled(): boolean {
  return getAiEnabledFlag() === 'true';
}
