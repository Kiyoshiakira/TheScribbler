import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Initialize the Google AI plugin.
// The plugin can be initialized without an API key.
// An error will be thrown by the Genkit framework if an API call is made
// without a key being set in the environment.
const googleAiPlugin = googleAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const ai = genkit({
  plugins: [googleAiPlugin],
  model: 'googleai/gemini-2.5-flash',
});
