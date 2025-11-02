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
2.  Copy the contents of `.env.example` into your new `.env.local` file.
3.  Fill in the required environment variables.

```env
# .env.local

# The API key for Google's Gemini models. Required for all AI features.
GEMINI_API_KEY=your_gemini_api_key_here
```

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

### Editor is Not Loading or App is Stuck on Loading Screen

This is often caused by an issue with Firebase authentication or data fetching.

1.  **Check Firebase Authentication:** Make sure you have enabled the `Email/Password` and `Google` sign-in providers in your Firebase project's Authentication settings.
2.  **Check Firestore Rules:** Ensure your `firestore.rules` are deployed and allow the signed-in user to read and write the necessary documents. An incorrect rule can cause data fetches to fail silently.
3.  **Check Browser Console:** Open the developer tools in your browser and look at the console for any errors, especially `FirebaseError: Missing or insufficient permissions`. This is a clear indicator that a Firestore rule is blocking a request.
4.  **Check API Keys:** Ensure your `GEMINI_API_KEY` in `.env.local` is correct. While the app should disable AI features gracefully, a misconfiguration could potentially cause issues.
