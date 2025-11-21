/**
 * AI Provider Abstraction Layer
 * 
 * This module provides an abstracted interface for AI operations, allowing
 * different AI providers (OpenAI, Google AI, local models) to be plugged in
 * without changing the application code.
 */

/**
 * Result of an AI operation with usage tracking
 */
export interface AiOperationResult {
  /** The generated text result */
  text: string;
  /** Optional confidence score (0-1) */
  confidence?: number;
  /** Tokens used in this operation */
  tokensUsed?: number;
  /** Any additional metadata from the provider */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for an AI provider
 */
export interface AiProviderConfig {
  /** Provider name */
  name: string;
  /** API key or credentials */
  apiKey?: string;
  /** Model identifier to use */
  model?: string;
  /** Maximum tokens per request */
  maxTokens?: number;
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** Custom endpoint URL (for local models) */
  endpoint?: string;
  /** Additional provider-specific options */
  options?: Record<string, unknown>;
}

/**
 * Context provided to AI operations
 */
export interface AiContext {
  /** The text being operated on */
  text: string;
  /** Optional surrounding context */
  precedingText?: string;
  followingText?: string;
  /** Document type hint */
  documentType?: 'screenplay' | 'story' | 'dialogue' | 'action' | 'other';
  /** Any additional context */
  metadata?: Record<string, unknown>;
}

/**
 * Options for rewrite operation
 */
export interface RewriteOptions {
  /** Style directive (e.g., "more concise", "more descriptive") */
  style?: string;
  /** Tone directive (e.g., "formal", "casual", "dramatic") */
  tone?: string;
  /** Preserve specific elements */
  preserve?: string[];
}

/**
 * Options for continue operation
 */
export interface ContinueOptions {
  /** Maximum length to generate */
  maxLength?: number;
  /** Style to continue in */
  style?: string;
}

/**
 * Options for summarize operation
 */
export interface SummarizeOptions {
  /** Target length (in words or sentences) */
  targetLength?: number;
  /** Format of summary */
  format?: 'paragraph' | 'bullets' | 'brief';
}

/**
 * Options for expand operation
 */
export interface ExpandOptions {
  /** Target length multiplier */
  expansionFactor?: number;
  /** Areas to focus on */
  focusAreas?: string[];
}

/**
 * Abstract base class for AI providers
 */
export abstract class AiProvider {
  protected config: AiProviderConfig;
  protected usageCount: number = 0;
  protected usageLimit: number = 100; // Default limit

  constructor(config: AiProviderConfig) {
    this.config = config;
  }

  /**
   * Get the provider name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Check if the provider is configured and ready
   */
  abstract isConfigured(): boolean;

  /**
   * Set usage limit for this provider
   */
  setUsageLimit(limit: number): void {
    this.usageLimit = limit;
  }

  /**
   * Get current usage count
   */
  getUsageCount(): number {
    return this.usageCount;
  }

  /**
   * Get remaining usage allowance
   */
  getRemainingUsage(): number {
    return Math.max(0, this.usageLimit - this.usageCount);
  }

  /**
   * Check if usage limit has been reached
   */
  hasReachedLimit(): boolean {
    return this.usageCount >= this.usageLimit;
  }

  /**
   * Reset usage counter
   */
  resetUsage(): void {
    this.usageCount = 0;
  }

  /**
   * Increment usage counter
   */
  protected incrementUsage(): void {
    this.usageCount++;
  }

  /**
   * Check usage limit before operation
   */
  protected checkUsageLimit(): void {
    if (this.hasReachedLimit()) {
      throw new AiProviderError(
        `Usage limit reached (${this.usageLimit}). Please wait or increase your limit.`,
        'USAGE_LIMIT_EXCEEDED'
      );
    }
  }

  /**
   * Rewrite the given text with specified options
   */
  abstract rewrite(
    context: AiContext,
    options?: RewriteOptions
  ): Promise<AiOperationResult>;

  /**
   * Continue/complete the given text
   */
  abstract continue(
    context: AiContext,
    options?: ContinueOptions
  ): Promise<AiOperationResult>;

  /**
   * Summarize the given text
   */
  abstract summarize(
    context: AiContext,
    options?: SummarizeOptions
  ): Promise<AiOperationResult>;

  /**
   * Expand bullet points or brief text into fuller content
   */
  abstract expand(
    context: AiContext,
    options?: ExpandOptions
  ): Promise<AiOperationResult>;
}

/**
 * Custom error class for AI provider errors
 */
export class AiProviderError extends Error {
  code: string;
  retryable: boolean;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', retryable: boolean = false) {
    super(message);
    this.name = 'AiProviderError';
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffFactor: 2,
};

/**
 * Retry helper with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: Error | undefined;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (error instanceof AiProviderError && !error.retryable) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === config.maxAttempts) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * config.backoffFactor, config.maxDelayMs);
    }
  }

  throw lastError || new Error('Operation failed after retries');
}
