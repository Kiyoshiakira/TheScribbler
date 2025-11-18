# The Scribbler

The Scribbler is a modern, collaborative writing application built with Next.js, Firebase, and Google's Generative AI. It provides powerful tools to assist writers in their creative process, with specialized interfaces for different types of writing.

<<<<<<< HEAD
## Tools

The Scribbler currently includes:
- **ScriptScribbler**: A screenwriting tool with AI-powered features for screenplay writing
- **StoryScribbler**: Coming soon - tools for story writing and organization
=======

ScriptScribbler is a modern, collaborative screenwriting application built with Next.js, Firebase, and Google's Generative AI. It provides a powerful editor with AI-powered tools to assist writers in their creative process.
>>>>>>> a4931b8 (Editing the readme)

## Application Architecture

The Scribbler is a **single-page application (SPA)** with a **tabbed sidebar interface** and **tool selection**. The application allows you to switch between different writing tools (ScriptScribbler, StoryScribbler) while sharing common features like Profile and Settings.

Additionally, there are separate public sharing routes for viewing scripts outside the main app, and utility tools for importing files.

## Getting Started

Follow these steps to get the development environment running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (usually comes with Node.js)

### 1. Install Dependencies

First, install the project dependencies using npm:

```bash
npm install
```

### 2. Set Up Environment Variables

The application uses environment variables to handle API keys and other configuration.

1.  Create a new file named `.env.local` in the root of the project by copying the `.env` file.
2.  Fill in the required environment variables in `.env.local`.

```env
# .env.local

# The API key for Google's Gemini models. Required for all AI features.
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project_id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your_measurement_id"

# Google Picker API Configuration
NEXT_PUBLIC_GOOGLE_API_KEY="your_google_cloud_api_key_for_picker"
NEXT_PUBLIC_GOOGLE_APP_ID="your_google_cloud_app_id"
```

**Note on `.env.local` vs `.env`:** This project follows the standard Next.js convention. You must place your secret keys in a file named `.env.local`. This file is ignored by version control, keeping your keys safe. The empty `.env` file in the project is just a placeholder and is not used for local development.

**Note:** AI features will be gracefully disabled if the `GEMINI_API_KEY` is not provided. Firebase features will not work without the Firebase configuration.

### 3. Run the Development Server

Once the dependencies are installed and the environment variables are set, you can run the local development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

## Features

### ScriptScribbler Tool

The ScriptScribbler tool uses tabs in the left sidebar to navigate between different views:

- **Dashboard Tab**: Manage your scripts, create new projects, and access recent work
- **Editor Tab**: Write screenplays using the built-in editor with Fountain format support
- **Logline Tab**: Create and edit concise story summaries for your screenplay
- **Scenes Tab**: Organize your script into structured scenes with details and metadata
- **Characters Tab**: Define and manage character profiles with descriptions and portraits (see [Character Management](docs/CHARACTER_MANAGEMENT.md))
- **Notes Tab**: Add production notes, ideas, and research for your screenplay

**Profile & Settings**: Access your profile and app settings via the user avatar menu in the top-right corner (not in the sidebar). These are shared across all tools.

### Script Management
- **Create and Edit Scripts**: Write screenplays using the Fountain format in the Editor tab
- **Import Scripts**: Import scripts from .scrite files (Scrite format) or .scribbler files (native format)
- **Import from Google Docs**: Directly import scripts from Google Docs with AI-powered formatting
- **Export Scripts**: Export your work in various formats (.scribbler, PDF, Fountain, Final Draft)

### Character Management (Scrite-inspired)
- **Automatic Creation**: Characters are automatically created when first mentioned in dialogue
- **Scene Tracking**: Automatic tracking of how many scenes each character appears in
- **Independent Persistence**: Characters persist even when removed from script content (prevents accidental data loss)
- **Manual Deletion Only**: Characters must be explicitly deleted from the Characters tab
- See [detailed documentation](docs/CHARACTER_MANAGEMENT.md) for more information

### Public Sharing (Separate Routes)

Share your work with others via dedicated public sharing routes (outside the main app):

- **Public Script Views**: Share your scripts with others via public URLs
  - View scripts at `/user/{userId}/script/{scriptId}`
  - Read-only access for non-owners
  - Full script content, characters, scenes, and notes visible
- **Public User Profiles**: View other users' profiles and their script portfolio at `/user/{userId}`

### Deletion Control
- **Selective Deletion**: When deleting a script from the Profile view (accessed via top-right avatar menu), choose exactly what to remove:
  - Script document itself
  - All characters
  - All scenes
  - All notes
  - Or any combination of the above

### Collaboration & AI
- **AI Assistant**: Get writing suggestions and script improvements from within the Editor tab
- **Public Access**: Scripts are readable by all authenticated users via public routes (write access remains owner-only)

## Available Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts a production server.
- `npm run lint`: Runs ESLint to check for code quality and style issues.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
- `npm run genkit:dev`: Starts the Genkit development UI for inspecting AI flows.

## Troubleshooting

### Login Fails or Editor is Not Loading

This is often caused by an issue with Firebase authentication or data fetching. If you see errors in the browser console like `(auth/invalid-credential)`, `(auth/operation-not-allowed)`, or a Google 403 error page, follow these steps:

1.  **Enable Authentication Providers:** The most common cause of login errors is that the sign-in methods are not enabled in your Firebase project.
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Select your project.
    *   In the left-hand menu, go to **Build > Authentication**.
    *   Click the **Sign-in method** tab.
    *   You **MUST** enable both **Email/Password** and **Google** as sign-in providers. Click on each one and flip the toggle to enable it.

2.  **Authorize Your Development Domain for Google Sign-In:** If you are trying to sign in with Google and see a "403 That's an error" page, it means you need to add your development domain to Firebase's authorized list.
    *   In the Firebase Console, go to **Authentication > Sign-in method**.
    *   Scroll down to the **Authorized domains** section.
    *   Click **Add domain**.
    *   Enter the domain of your development environment.
        *   If you are running locally, this is `localhost`.
        *   If you are in a cloud workspace (like Firebase Studio), this will be a URL ending in `.cloudworkstations.dev` or similar. Copy this domain from your browser's address bar.
    *   Click **Add** to save the domain.

3.  **Check Firestore Rules:** Ensure your `firestore.rules` are deployed and allow the signed-in user to read and write the necessary documents. An incorrect rule can cause data fetches to fail silently. You can check for `FirebaseError: Missing or insufficient permissions` in the browser console.

4.  **Check API Keys:** Ensure your environment variables in `.env.local` are correct. While the app should disable AI features gracefully, a misconfiguration could potentially cause issues.
