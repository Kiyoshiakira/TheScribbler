# Getting Started with ScriptScribbler

Welcome! This guide will help you set up ScriptScribbler on your local machine and get started with your first screenplay project.

## Prerequisites

Before you begin, ensure you have the following installed:

- **[Node.js](https://nodejs.org/)** (v18 or later recommended)
- **[npm](https://www.npmjs.com/)** (usually comes with Node.js)
- A Firebase account (for authentication and database)
- A Google Gemini API key (for AI features)

## Installation

### 1. Install Dependencies

First, install the project dependencies using npm:

```bash
npm install
```

### 2. Set Up Environment Variables

The application uses environment variables to handle API keys and other configuration.

1. Create a new file named `.env.local` in the root of the project
2. Fill in the required environment variables:

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

**Important Notes:**
- **`.env.local` vs `.env`**: This project follows the standard Next.js convention. You must place your secret keys in a file named `.env.local`. This file is ignored by version control, keeping your keys safe.
- **AI Features**: AI features will be gracefully disabled if the `GEMINI_API_KEY` is not provided
- **Firebase**: Firebase features will not work without the Firebase configuration

### 3. Run the Development Server

Once the dependencies are installed and the environment variables are set, you can run the local development server:

```bash
npm run dev
```

The application will be available at **[http://localhost:9002](http://localhost:9002)**

## Available Scripts

Here are the main commands you can use during development:

| Command | Description |
|---------|-------------|
| `npm run dev` | Starts the Next.js development server with Turbopack |
| `npm run build` | Builds the application for production |
| `npm run start` | Starts a production server |
| `npm run lint` | Runs ESLint to check for code quality and style issues |
| `npm run typecheck` | Runs the TypeScript compiler to check for type errors |
| `npm run genkit:dev` | Starts the Genkit development UI for inspecting AI flows |

## First Steps After Installation

1. **Sign Up / Log In**: Create an account or sign in with Google
2. **Create Your First Script**: Click "New Script" from the Dashboard
3. **Explore the Editor**: Start writing using [Fountain syntax](Fountain-Guide)
4. **Try AI Features**: Use the AI assistant to get writing suggestions
5. **Organize Your Work**: Use the Characters, Scenes, and Notes tabs

## Common Setup Issues

### Login Fails, 403 Errors, or Editor is Not Loading

**⚠️ See the [Complete 403 Troubleshooting Guide](../docs/TROUBLESHOOTING_403_ERRORS.md) for detailed solutions.**

This is often caused by an issue with Firebase authentication or data fetching. If you see errors in the browser console like `(auth/invalid-credential)`, `(auth/operation-not-allowed)`, or a Google 403 error page, follow these steps:

#### 1. Enable Authentication Providers

The most common cause of login errors is that the sign-in methods are not enabled in your Firebase project.

- Go to the [Firebase Console](https://console.firebase.google.com/)
- Select your project
- In the left-hand menu, go to **Build > Authentication**
- Click the **Sign-in method** tab
- You **MUST** enable both **Email/Password** and **Google** as sign-in providers
- Click on each one and flip the toggle to enable it

#### 2. Authorize Your Development Domain for Google Sign-In

If you are trying to sign in with Google and see a "403 That's an error" page, it means you need to add your development domain to Firebase's authorized list.

- In the Firebase Console, go to **Authentication > Sign-in method**
- Scroll down to the **Authorized domains** section
- Click **Add domain**
- Enter the domain of your development environment:
  - If you are running locally, this is `localhost`
  - If you are in a cloud workspace (like Firebase Studio), this will be a URL ending in `.cloudworkstations.dev` or similar. Copy this domain from your browser's address bar
- Click **Add** to save the domain

#### 3. Check Firestore Rules

Ensure your `firestore.rules` are deployed and allow the signed-in user to read and write the necessary documents. An incorrect rule can cause data fetches to fail silently. You can check for `FirebaseError: Missing or insufficient permissions` in the browser console.

#### 4. Check API Keys

Ensure your environment variables in `.env.local` are correct. While the app should disable AI features gracefully, a misconfiguration could potentially cause issues.

## Next Steps

Now that you have ScriptScribbler running:

- Learn about [Application Features](Application-Features)
- Master [Fountain Syntax](Fountain-Guide)
- Explore [AI-Powered Tools](AI-Editor-Features)
- Understand [Character Management](Character-Management)

---

**Need more help?** Check the [Troubleshooting](Troubleshooting) page or review the [Application Features](Application-Features) guide.
