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

### Login Fails or 403 Errors

**⚠️ If you're experiencing 403 errors or sign-in issues, see the [Detailed 403 Troubleshooting Guide](docs/TROUBLESHOOTING_403_ERRORS.md) for step-by-step solutions.**

This is often caused by an issue with Firebase authentication setup. Common issues include:

1.  **Enable Authentication Providers:** The most common cause - sign-in methods are not enabled in Firebase.
    *   Go to [Firebase Console](https://console.firebase.google.com/) > Your Project
    *   Navigate to **Build > Authentication > Sign-in method**
    *   Enable both **Email/Password** AND **Google** providers
    *   Click each one and flip the toggle to **ON**

2.  **Authorize Your Domain for Google Sign-In:** If you see "403 That's an error" when using Google sign-in:
    *   In Firebase Console, go to **Authentication > Sign-in method**
    *   Scroll to **Authorized domains** section
    *   Click **Add domain**
    *   Add your domain:
        *   Local development: `localhost`
        *   Cloud workspace: Copy from browser address bar (e.g., `xyz.cloudworkstations.dev`)
    *   Click **Add** to save

3.  **Configure OAuth Consent Screen (if using Google Docs import):**
    *   The app requests Drive/Docs permissions for importing scripts
    *   If you see OAuth errors, configure the consent screen in Google Cloud Console
    *   Or temporarily disable Drive/Docs scopes (see [troubleshooting guide](docs/TROUBLESHOOTING_403_ERRORS.md))

4.  **Check Firestore Rules:** Ensure `firestore.rules` are deployed and allow authenticated users access.
    *   Look for `FirebaseError: Missing or insufficient permissions` in browser console
    *   Deploy rules: `firebase deploy --only firestore:rules`

5.  **Verify Environment Variables:** Check that `.env.local` has all required Firebase configuration.

**For detailed solutions with screenshots and step-by-step instructions, see [docs/TROUBLESHOOTING_403_ERRORS.md](docs/TROUBLESHOOTING_403_ERRORS.md)**
