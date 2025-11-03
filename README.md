# ScriptScribbler

ScriptScribbler is a modern, collaborative screenwriting application built with Next.js, Firebase, and Google's Generative AI. It provides a powerful editor with AI-powered tools to assist writers in their creative process.

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

1.  Create a new file named `.env.local` in the root of the project.
2.  Fill in the required environment variables as shown below.

```env
# .env.local

# The API key for Google's Gemini models. Required for all AI features.
GEMINI_API_KEY=your_gemini_api_key_here
```

**Note on `.env.local` vs `.env`:** This project follows the standard Next.js convention. You must place your secret keys in a file named `.env.local`. This file is ignored by version control, keeping your keys safe. The empty `.env` file in the project is just a placeholder and is not used for local development.

**Note:** AI features will be gracefully disabled if the `GEMINI_API_KEY` is not provided.

### 3. Run the Development Server

Once the dependencies are installed and the environment variables are set, you can run the local development server:

```bash
npm run dev
```

The application will be available at [http://localhost:9002](http://localhost:9002).

## Available Scripts

- `npm run dev`: Starts the Next.js development server with Turbopack.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts a production server.
- `npm run lint`: Runs ESLint to check for code quality and style issues.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
- `npm run genkit:dev`: Starts the Genkit development UI for inspecting AI flows.

## Troubleshooting

### Login Fails or Editor is Not Loading

This is often caused by an issue with Firebase authentication or data fetching. If you see errors in the browser console like `(auth/invalid-credential)`, `(auth/operation-not-allowed)`, or `accounts.google.com refused to connect`, follow these steps:

1.  **Enable Authentication Providers:** The most common cause of login errors is that the sign-in methods are not enabled in your Firebase project.
    *   Go to the [Firebase Console](https://console.firebase.google.com/).
    *   Select your project.
    *   In the left-hand menu, go to **Build > Authentication**.
    *   Click the **Sign-in method** tab.
    *   You **MUST** enable both **Email/Password** and **Google** as sign-in providers. Click on each one and flip the toggle to enable it.

2.  **Authorize Your Domain for Google Sign-In:** If you see an error that `accounts.google.com refused to connect`, it means you need to add your development domain to Firebase's authorized list.
    *   In the Firebase Console, go to **Authentication > Sign-in method**.
    *   Scroll down to the **Authorized domains** section.
    *   Click **Add domain**.
    *   Enter `localhost` and click **Add**. This is essential for local development.

3.  **Check Firestore Rules:** Ensure your `firestore.rules` are deployed and allow the signed-in user to read and write the necessary documents. An incorrect rule can cause data fetches to fail silently. You can check for `FirebaseError: Missing or insufficient permissions` in the browser console.

4.  **Check API Keys:** Ensure your `GEMINI_API_KEY` in `.env.local` is correct. While the app should disable AI features gracefully, a misconfiguration could potentially cause issues.
