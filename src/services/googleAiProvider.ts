/**
 * Google AI (Gemini) Provider Implementation
 * 
 * This provider wraps the existing Genkit AI functionality to work with
 * the abstract AI provider interface.
 */

import {
  AiProvider,
  AiProviderConfig,
  AiContext,
  RewriteOptions,
  ContinueOptions,
  SummarizeOptions,
  ExpandOptions,
  AiOperationResult,
  AiProviderError,
  withRetry,
} from './aiProvider';
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Google AI provider using Gemini models
 */
export class GoogleAiProvider extends AiProvider {
  private model: string;

  constructor(config: AiProviderConfig) {
    super(config);
    this.model = config.model || 'gemini-2.0-flash-exp';
  }

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  /**
   * Rewrite text with specified style and tone
   */
  async rewrite(
    context: AiContext,
    options?: RewriteOptions
  ): Promise<AiOperationResult> {
    this.checkUsageLimit();

    const styleDirective = options?.style || 'clear and engaging';
    const toneDirective = options?.tone || 'appropriate for the content';

    const prompt = this.buildRewritePrompt(context, styleDirective, toneDirective);

    return withRetry(async () => {
      try {
        const result = await this.generateText(prompt, context.documentType);
        this.incrementUsage();
        return result;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  /**
   * Continue/complete the given text
   */
  async continue(
    context: AiContext,
    options?: ContinueOptions
  ): Promise<AiOperationResult> {
    this.checkUsageLimit();

    const maxLength = options?.maxLength || 200;
    const style = options?.style || 'matching the existing style';

    const prompt = this.buildContinuePrompt(context, maxLength, style);

    return withRetry(async () => {
      try {
        const result = await this.generateText(prompt, context.documentType);
        this.incrementUsage();
        return result;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  /**
   * Summarize the given text
   */
  async summarize(
    context: AiContext,
    options?: SummarizeOptions
  ): Promise<AiOperationResult> {
    this.checkUsageLimit();

    const format = options?.format || 'paragraph';
    const targetLength = options?.targetLength || 100;

    const prompt = this.buildSummarizePrompt(context, format, targetLength);

    return withRetry(async () => {
      try {
        const result = await this.generateText(prompt, context.documentType);
        this.incrementUsage();
        return result;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  /**
   * Expand bullet points or brief text
   */
  async expand(
    context: AiContext,
    options?: ExpandOptions
  ): Promise<AiOperationResult> {
    this.checkUsageLimit();

    const expansionFactor = options?.expansionFactor || 2;
    const focusAreas = options?.focusAreas || [];

    const prompt = this.buildExpandPrompt(context, expansionFactor, focusAreas);

    return withRetry(async () => {
      try {
        const result = await this.generateText(prompt, context.documentType);
        this.incrementUsage();
        return result;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  /**
   * Build prompt for rewrite operation
   */
  private buildRewritePrompt(
    context: AiContext,
    style: string,
    tone: string
  ): string {
    const typeContext = this.getTypeContext(context.documentType);
    
    return `You are an expert ${typeContext} editor. Rewrite the following text to be ${style} with a ${tone} tone.

${context.precedingText ? `Previous context:\n${context.precedingText}\n\n` : ''}Text to rewrite:
${context.text}
${context.followingText ? `\n\nFollowing context:\n${context.followingText}` : ''}

Provide only the rewritten text without explanations or meta-commentary.`;
  }

  /**
   * Build prompt for continue operation
   */
  private buildContinuePrompt(
    context: AiContext,
    maxLength: number,
    style: string
  ): string {
    const typeContext = this.getTypeContext(context.documentType);

    return `You are an expert ${typeContext} writer. Continue the following text in a way that ${style}.

${context.precedingText ? `Earlier context:\n${context.precedingText}\n\n` : ''}Current text:
${context.text}

Continue this text naturally for approximately ${maxLength} words. Provide only the continuation without repeating the original text or adding explanations.`;
  }

  /**
   * Build prompt for summarize operation
   */
  private buildSummarizePrompt(
    context: AiContext,
    format: string,
    targetLength: number
  ): string {
    const typeContext = this.getTypeContext(context.documentType);
    const formatInstruction = format === 'bullets' 
      ? 'a bulleted list' 
      : format === 'brief' 
      ? 'a brief one-sentence summary' 
      : 'a concise paragraph';

    return `You are an expert ${typeContext} editor. Summarize the following text in ${formatInstruction}, approximately ${targetLength} words.

Text to summarize:
${context.text}

Provide only the summary without meta-commentary.`;
  }

  /**
   * Build prompt for expand operation
   */
  private buildExpandPrompt(
    context: AiContext,
    expansionFactor: number,
    focusAreas: string[]
  ): string {
    const typeContext = this.getTypeContext(context.documentType);
    const focusInstruction = focusAreas.length > 0
      ? `Pay special attention to: ${focusAreas.join(', ')}.`
      : '';

    return `You are an expert ${typeContext} writer. Expand the following brief text or bullet points into fuller, more detailed content. Make it approximately ${expansionFactor}x longer while maintaining quality. ${focusInstruction}

${context.precedingText ? `Context:\n${context.precedingText}\n\n` : ''}Text to expand:
${context.text}

Provide only the expanded text without explanations.`;
  }

  /**
   * Get context description based on document type
   */
  private getTypeContext(documentType?: string): string {
    switch (documentType) {
      case 'screenplay':
        return 'screenplay';
      case 'dialogue':
        return 'dialogue';
      case 'action':
        return 'action description';
      case 'story':
        return 'story';
      default:
        return 'writing';
    }
  }

  /**
   * Generate text using Genkit AI
   */
  private async generateText(
    prompt: string,
    documentType?: string
  ): Promise<AiOperationResult> {
    const inputSchema = z.object({
      prompt: z.string(),
    });
    const outputSchema = z.object({
      text: z.string(),
    });

    const promptDef = ai.definePrompt({
      name: 'aiHelperPrompt',
      model: googleAI.model(this.model),
      config: {
        temperature: this.config.temperature || 0.7,
        maxOutputTokens: this.config.maxTokens || 1024,
      },
      input: { schema: inputSchema },
      output: { schema: outputSchema },
      prompt: '{{{prompt}}}',
    });

    const generateFlow = ai.defineFlow(
      {
        name: 'aiHelperGenerate',
        inputSchema,
        outputSchema,
      },
      async (input) => {
        const { output } = await promptDef(input);
        if (!output) {
          throw new Error('AI failed to generate text');
        }
        return output;
      }
    );

    const result = await generateFlow({ prompt });

    return {
      text: result.text,
      tokensUsed: undefined, // Genkit doesn't expose this directly
      confidence: 0.8, // Default confidence
      metadata: {
        model: this.model,
        documentType,
      },
    };
  }

  /**
   * Handle errors and convert to AiProviderError
   */
  private handleError(error: unknown): AiProviderError {
    if (error instanceof AiProviderError) {
      return error;
    }

    const message = error instanceof Error ? error.message : 'Unknown error occurred';

    // Check for rate limiting or quota errors (retryable)
    if (message.includes('quota') || message.includes('rate limit')) {
      return new AiProviderError(
        'Rate limit or quota exceeded. Please try again later.',
        'RATE_LIMIT',
        true
      );
    }

    // Check for authentication errors (not retryable)
    if (message.includes('auth') || message.includes('API key')) {
      return new AiProviderError(
        'Authentication failed. Please check your API key.',
        'AUTH_ERROR',
        false
      );
    }

    // Default to retryable error (changed from non-retryable for better resilience)
    return new AiProviderError(message, 'PROVIDER_ERROR', true);
  }
}
