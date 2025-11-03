# Debugging: Import & Reformat Failure

## The Error

A recurring error is happening during file import (`.scrite` or from Google Docs): **"Import Failed: An error occurred while reformatting the script."**

This indicates that the AI-powered reformatting step is failing, which stops the entire import process.

## The Workflow

Here is the sequence of events that leads to the error:

1.  A user initiates an import from the UI in `app-header.tsx`.
2.  The content is extracted from the file (either a Scrite file or a Google Doc).
3.  The `runAiReformatScript` server action is called from `app-header.tsx` to clean up the extracted text.
4.  This server action, located in `actions.ts`, invokes the Genkit flow `aiReformatScriptFlow`.
5.  The `aiReformatScriptFlow` in `ai-reformat-script.ts` calls the Gemini model to perform the reformatting.
6.  The AI model returns an unexpected result (e.g., not valid JSON, or an error from the service), causing the `runAiReformatScript` action to return an error object.
7.  The `app-header.tsx` component receives this error and displays the "Import Failed" toast message.

## Files Involved

These are the key files that are part of this process:

1.  **`src/components/layout/app-header.tsx`**:
    -   **Role:** The starting point. Contains the UI for importing files and calls the server action.
    -   **Functions to check:** `handleScriteImport`, `processImportedContent`.

2.  **`src/app/actions.ts`**:
    -   **Role:** The bridge between the client and the server-side AI logic.
    -   **Function to check:** `runAiReformatScript`. This function wraps the AI call and handles returning either data or an error.

3.  **`src/ai/flows/ai-reformat-script.ts`**:
    -   **Role:** The core AI logic file.
    -   **Function to check:** `aiReformatScriptFlow`. This defines the prompt sent to the Gemini model and specifies the expected output format (a JSON object with a `formattedScript` string).

4.  **`src/ai/genkit.ts`**:
    -   **Role:** Configures the Genkit AI instance, including the model and API key. An error here could affect all AI calls.

By examining these files, we can trace the data and pinpoint exactly where the reformatting is failing.
