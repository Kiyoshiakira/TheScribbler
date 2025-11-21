# AI Integration Documentation

This document describes the AI provider abstraction layer and how to use and extend it.

## Overview

The Scribbler implements an abstracted AI provider system that allows different AI services (Google AI, OpenAI, local models) to be used interchangeably. This design makes it easy to:

- Switch between different AI providers
- Add new providers without changing application code
- Track and limit AI usage
- Handle errors and retries consistently

## Architecture

### Core Components

1. **AI Provider Interface** (`src/services/aiProvider.ts`)
   - Defines the abstract base class `AiProvider`
   - Provides common functionality (usage tracking, rate limiting)
   - Defines operation interfaces (rewrite, continue, summarize, expand)

2. **Provider Implementations**
   - `GoogleAiProvider` (`src/services/googleAiProvider.ts`) - Google AI (Gemini) integration
   - Additional providers can be added by implementing the `AiProvider` interface

3. **Provider Registry** (`src/services/aiProviderRegistry.ts`)
   - Manages available providers
   - Handles provider instantiation and configuration
   - Maintains the active provider instance

4. **UI Components**
   - `AIHelper` (`src/components/AI/AIHelper.tsx`) - Main UI panel for AI operations
   - Provides user interface for rewrite, continue, summarize, and expand operations

5. **Server Actions** (`src/app/ai-helper-actions.ts`)
   - Bridge between client UI and provider layer
   - Handle error responses and provider status

## Supported Operations

### Rewrite
Rewrites existing text with specified style and tone options.

**Options:**
- `style`: Writing style (e.g., "clear and engaging", "more concise")
- `tone`: Tone of writing (e.g., "professional", "casual")

**Example:**
```typescript
await provider.rewrite(
  { text: "Your text here" },
  { style: "more concise", tone: "professional" }
);
```

### Continue
Continues or completes existing text naturally.

**Options:**
- `maxLength`: Target length for continuation (words)
- `style`: Style to match

**Example:**
```typescript
await provider.continue(
  { text: "The story begins..." },
  { maxLength: 200, style: "matching the existing style" }
);
```

### Summarize
Creates a summary of the provided text.

**Options:**
- `format`: Output format ("paragraph", "bullets", "brief")
- `targetLength`: Approximate length (words)

**Example:**
```typescript
await provider.summarize(
  { text: "Long text to summarize..." },
  { format: "bullets", targetLength: 100 }
);
```

### Expand
Expands brief text or bullet points into fuller content.

**Options:**
- `expansionFactor`: How much to expand (2x, 3x, etc.)
- `focusAreas`: Specific areas to emphasize

**Example:**
```typescript
await provider.expand(
  { text: "• Character development\n• Plot twist" },
  { expansionFactor: 3 }
);
```

## Configuration

### Environment Variables

Set these in your `.env.local` file:

```bash
# Google AI (Gemini) API Key
GEMINI_API_KEY=your_api_key_here

# Optional: Usage limit per session
AI_USAGE_LIMIT=100
```

### Getting API Keys

#### Google AI (Gemini)
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env.local` file

## Adding a New Provider

To add support for a new AI provider (e.g., OpenAI):

### 1. Create Provider Implementation

Create a new file `src/services/openaiProvider.ts`:

```typescript
import {
  AiProvider,
  AiProviderConfig,
  AiContext,
  RewriteOptions,
  // ... other imports
} from './aiProvider';

export class OpenAiProvider extends AiProvider {
  constructor(config: AiProviderConfig) {
    super(config);
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey);
  }

  async rewrite(
    context: AiContext,
    options?: RewriteOptions
  ): Promise<AiOperationResult> {
    this.checkUsageLimit();
    
    // Implement OpenAI API call here
    // ...
    
    this.incrementUsage();
    return result;
  }

  // Implement other methods...
}
```

### 2. Register Provider

Update `src/services/aiProviderRegistry.ts`:

```typescript
import { OpenAiProvider } from './openaiProvider';

// In the AiProviderRegistry constructor:
this.registerProvider({
  type: 'openai',
  factory: (config) => new OpenAiProvider(config),
  displayName: 'OpenAI',
  description: 'OpenAI GPT models',
  requiresApiKey: true,
});
```

### 3. Update Environment Initialization

Modify `initializeProviderFromEnv()` in `aiProviderRegistry.ts`:

```typescript
export function initializeProviderFromEnv(): AiProvider | null {
  // Check for OpenAI configuration
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey && openaiKey.trim()) {
    const provider = providerRegistry.createProvider('openai', {
      name: 'openai',
      apiKey: openaiKey,
      model: 'gpt-4',
      // ... other config
    });
    
    providerRegistry.setActiveProvider(provider);
    return provider;
  }

  // Fall back to Google AI...
  // ...
}
```

### 4. Add Settings UI (Optional)

To allow users to select providers in settings, update `src/components/settings-dialog.tsx` to include provider selection dropdown.

## Usage Tracking and Limits

The provider system includes built-in usage tracking:

```typescript
const provider = getActiveProvider();

// Set usage limit
provider.setUsageLimit(100);

// Check usage
const used = provider.getUsageCount();
const remaining = provider.getRemainingUsage();
const limitReached = provider.hasReachedLimit();

// Reset usage (e.g., daily)
provider.resetUsage();
```

Usage limits help prevent:
- Excessive API costs
- Rate limiting from providers
- Accidental overuse

## Error Handling

The system includes comprehensive error handling:

### Error Types

```typescript
try {
  const result = await provider.rewrite(context, options);
} catch (error) {
  if (error instanceof AiProviderError) {
    console.log(error.code); // Error code
    console.log(error.retryable); // Whether retry is recommended
  }
}
```

### Automatic Retry

Operations automatically retry with exponential backoff:

```typescript
import { withRetry, DEFAULT_RETRY_CONFIG } from './aiProvider';

const result = await withRetry(
  async () => await someOperation(),
  {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffFactor: 2,
  }
);
```

## Privacy and Security

### Opt-in Consent

Users must explicitly consent before AI features are enabled:
- First use shows a consent dialog
- Consent is stored in localStorage
- Users can revoke consent anytime

### Data Handling

- Text is sent to the selected AI provider for processing
- API keys are stored in environment variables (server) or localStorage (client)
- No text is logged or persisted beyond the user's session
- Users are informed about data transmission in the consent dialog

### Best Practices

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables for server-side keys
   - Warn users about storing keys in browser localStorage

2. **User Privacy**
   - Make AI features opt-in
   - Clearly communicate what data is sent to providers
   - Provide easy opt-out mechanisms

3. **Usage Limits**
   - Set reasonable default limits
   - Allow users to configure limits
   - Display usage information in the UI

## UI Integration

### Using the AIHelper Component

```typescript
import AIHelper from '@/components/AI/AIHelper';

function MyEditor() {
  const [selectedText, setSelectedText] = useState('');

  const handleTextGenerated = (text: string, operation: string) => {
    console.log(`Generated ${operation}:`, text);
  };

  const handleAccept = (text: string) => {
    // Insert the generated text into the editor
    insertText(text);
  };

  return (
    <AIHelper
      selectedText={selectedText}
      onTextGenerated={handleTextGenerated}
      onAccept={handleAccept}
    />
  );
}
```

### Server Actions

Server actions provide a clean API for client components:

```typescript
import {
  runAiHelperRewrite,
  getAiProviderStatus,
} from '@/app/ai-helper-actions';

// Get provider status
const status = await getAiProviderStatus();
console.log(status.isConfigured, status.remainingUsage);

// Perform rewrite
const result = await runAiHelperRewrite({
  text: "Text to rewrite",
  style: "more concise",
  tone: "professional",
});

if (result.error) {
  console.error(result.error);
} else {
  console.log(result.data.text);
}
```

## Testing

### Testing a Provider Implementation

```typescript
import { GoogleAiProvider } from '@/services/googleAiProvider';

describe('GoogleAiProvider', () => {
  let provider: GoogleAiProvider;

  beforeEach(() => {
    provider = new GoogleAiProvider({
      name: 'google-ai',
      apiKey: process.env.GEMINI_API_KEY!,
      model: 'gemini-2.0-flash-exp',
    });
    provider.setUsageLimit(10);
  });

  test('rewrite operation', async () => {
    const result = await provider.rewrite(
      { text: 'Test text' },
      { style: 'concise' }
    );
    
    expect(result.text).toBeTruthy();
    expect(provider.getUsageCount()).toBe(1);
  });

  test('usage limit enforcement', async () => {
    provider.setUsageLimit(0);
    
    await expect(
      provider.rewrite({ text: 'Test' })
    ).rejects.toThrow('Usage limit reached');
  });
});
```

## Troubleshooting

### Common Issues

**AI features not available**
- Check that `GEMINI_API_KEY` is set in `.env.local`
- Verify the API key is valid
- Check provider status in the UI

**Usage limit reached**
- Check current usage in provider status
- Reset usage counter if needed
- Increase usage limit in environment variables

**Errors during AI operations**
- Check network connectivity
- Verify API key is valid and has quota
- Check console for detailed error messages
- Review retry logic for transient failures

## Future Enhancements

Potential improvements to the AI integration:

1. **Additional Providers**
   - OpenAI GPT models
   - Anthropic Claude
   - Local models (Ollama, LM Studio)

2. **Advanced Features**
   - Streaming responses for long generations
   - Batch processing for multiple texts
   - Custom prompt templates
   - Fine-tuning support

3. **Improved UI**
   - Side-by-side comparison of original and rewritten text
   - Version history of AI suggestions
   - Inline suggestions in the editor
   - Keyboard shortcuts for AI operations

4. **Settings Enhancements**
   - Provider selection in settings
   - Per-provider configuration
   - Usage statistics and analytics
   - Cost estimation

## Resources

- [Google AI Studio](https://makersuite.google.com/)
- [Genkit Documentation](https://firebase.google.com/docs/genkit)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Ollama](https://ollama.ai/) - Local model runner

## Support

For issues or questions about AI integration:
1. Check this documentation
2. Review error messages in console
3. Verify environment configuration
4. Submit an issue on GitHub
