# The Scribbler 📝

The Scribbler is a modern, collaborative writing application built with Next.js, Firebase, and Google's Generative AI. It provides powerful tools to assist writers in their creative process, with specialized interfaces for screenplay and story writing.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Latest-orange)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

## ✨ Key Features

- **🎬 ScriptScribbler** - Professional screenplay editor with Fountain syntax support
- **📚 StoryScribbler** - Comprehensive story development tool with outline, chapters, and world-building
- **🤖 AI-Powered Features** - Intelligent writing assistance powered by Google's Gemini
- **⚙️ Comprehensive Settings** - Theme selection, export formats, editor customization, and privacy controls
- **👥 Character Management** - Scrite-inspired character tracking and profiles
- **🎭 Scene Organization** - Visual scene blocks with metadata and collapsible sections
- **🔄 Public Sharing** - Share your scripts and stories with others via public URLs
- **📤 Multiple Export Formats** - Export to PDF, Fountain, Final Draft, and more
- **🔐 Secure Authentication** - Firebase authentication with Google and email/password
- **☁️ Cloud Storage** - Real-time sync with Firebase Firestore
- **📱 Responsive Design** - Works seamlessly on desktop and mobile devices

## 🚀 Quick Start for New Users

**🔥 Having 403 sign-in errors?** See the **[Quick Start Card](docs/QUICK_START_CARD.md)** for a 4-step fix (10 minutes).

**Setting up for the first time?** Follow these guides in order:

1. **[User Setup Instructions](docs/USER_SETUP_INSTRUCTIONS.md)** - What YOU need to do in Firebase Console ⭐ **START HERE**
2. **[Setup Checklist](docs/SETUP_CHECKLIST.md)** - Complete setup verification checklist
3. **[Getting Started](#getting-started)** - Local installation steps (below)

**Need detailed troubleshooting?** See the **[403 Troubleshooting Guide](docs/TROUBLESHOOTING_403_ERRORS.md)** for comprehensive solutions.

### Setup Flow Overview

```
Firebase Console Setup (REQUIRED)          Local Project Setup
------------------------                   -------------------
1. Enable Email/Password auth       →      1. npm install
2. Enable Google auth               →      2. Create .env.local
3. Add authorized domains           →      3. npm run dev
4. Create Firestore database        →      4. Test sign-in
   ↓
   Success! You can now sign in
```

---

## 📚 Table of Contents

- [Quick Start for New Users](#-quick-start-for-new-users)
- [What's Inside](#-whats-inside)
- [Application Architecture](#-application-architecture)
- [Getting Started](#getting-started)
- [Features](#features)
- [Documentation](#-documentation)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 What's Inside

### ScriptScribbler
A professional screenwriting tool with:
- **Fountain Format Support** - Industry-standard screenplay markup
- **Scene Blocks** - Scrite-like collapsible scene organization
- **Character Management** - Automatic character tracking and profiles
- **AI Assistant** - Smart writing suggestions and improvements
- **Multiple Export Formats** - PDF, Fountain, Final Draft, and more

### StoryScribbler
A comprehensive story development tool with:
- **Outline Tab** - Hierarchical story structure
- **Chapters Tab** - Chapter management with word count tracking
- **Characters Tab** - Detailed character profiles and development
- **World Building Tab** - Settings, cultures, and lore management
- **Timeline Tab** - Visual event timeline with categorization
- **Story Notes Tab** - Organized notes with tags and categories

## 🏗️ Application Architecture

The Scribbler is a **single-page application (SPA)** with a **tabbed sidebar interface** that allows seamless switching between different writing tools.

### Main Application Structure

**Left Sidebar Tabs:**
- **Dashboard** - Script management and quick access
- **Editor** - Screenplay/story writing interface
- **Logline** - Story summary and loglines
- **Scenes** - Scene organization and management
- **Characters** - Character profiles and tracking
- **Notes** - Ideas, research, and production notes

**Top-Right User Menu:**
- **Profile** - User profile and script portfolio management
- **Settings** - Application preferences (theme, export defaults, editor font size, AI features, privacy)
- **Sign Out** - Secure logout

**Tool Selector:**
- Switch between ScriptScribbler and StoryScribbler tools
- Each tool has specialized features for its writing type
- Shared resources like Profile and Settings across tools

### Additional Features

**Public Sharing Routes** (separate from main app):
- `/user/{userId}` - Public user profile view with script portfolio
- `/user/{userId}/script/{scriptId}` - Public read-only script view

**Utility Routes:**
- `/import-scrite` - Scrite to Fountain converter tool
- `/login` - Authentication page

For detailed architecture information, see [docs/IMPLEMENTATION_HISTORY.md](docs/IMPLEMENTATION_HISTORY.md).

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

### ScriptScribbler Features

#### ✍️ Screenplay Editor
- **Fountain Format Support** - Write using industry-standard Fountain syntax
- **Scene Blocks** - Scrite-inspired collapsible scene organization
- **Multiple Block Types** - Scene headings, action, dialogue, transitions, centered text, sections, and synopsis
- **Keyboard Shortcuts** - Tab to cycle block types, Enter for new blocks, Shift+Enter for line breaks
- **Visual Hierarchy** - Clear distinction between different screenplay elements
- **Find & Replace** - Search and replace text throughout your script

#### 🎭 Character Management (Scrite-inspired)
- **Automatic Creation** - Characters are automatically created when first mentioned in dialogue
- **Scene Tracking** - Automatic tracking of character appearances across scenes
- **Independent Persistence** - Characters persist even when removed from script (prevents accidental data loss)
- **Manual Deletion Only** - Characters must be explicitly deleted to prevent data loss
- **Character Profiles** - Add descriptions, backgrounds, and portraits
- See [docs/CHARACTER_MANAGEMENT.md](docs/CHARACTER_MANAGEMENT.md) for detailed information

#### 🎬 Scene Management
- **Scene Organization** - Visual scene blocks with collapsible sections
- **Scene Metadata** - Track scene number, setting, estimated time, and description
- **Scene Details** - Add time of day, location, and story beats
- **Visual Navigation** - Collapse/expand scenes for easier script navigation

#### 📝 Additional Script Features
- **Logline Editor** - Craft compelling one-sentence story summaries
- **Notes Management** - Add production notes, ideas, and research
- **Dashboard** - Manage multiple scripts with quick access
- **Script Import** - Import from .scrite files (Scrite format) or .scribbler files (native format)
- **Google Docs Import** - Directly import scripts from Google Docs with AI-powered formatting

#### 📤 Export Options
- **PDF Export** - Professional screenplay PDFs
- **Fountain Export** - Industry-standard Fountain format
- **Final Draft Export** - Compatible with Final Draft software
- **.scribbler Format** - Native format preserving all data
- See [docs/EXPORT_FUNCTIONALITY.md](docs/EXPORT_FUNCTIONALITY.md) for details

#### 🤖 AI Features
- **Writing Assistant** - Get intelligent suggestions and improvements
- **Script Analysis** - AI-powered script review and feedback
- **Character Insights** - AI-generated character suggestions
- **Scene Suggestions** - Story development assistance
- **Document-Aware Editing** - Semantic understanding with RAG for long documents
- **Structured Editing Tools** - Apply formatting rules, generate structures, and more
- **Creative Consistency** - Maintains Skylantia universe terminology and style
- See [docs/AI_EDITOR_FEATURES.md](docs/AI_EDITOR_FEATURES.md) for comprehensive AI features
- See [docs/AI_DOCUMENT_AWARE_EDITING.md](docs/AI_DOCUMENT_AWARE_EDITING.md) for advanced editing capabilities

### StoryScribbler Features

#### 📋 Outline Tab
- Hierarchical story structure with parent-child relationships
- Expandable/collapsible sections for organization
- Order management for story beats
- Full CRUD operations

#### 📖 Chapters Tab
- Chapter cards with title, summary, and content
- Automatic word count tracking (per chapter and total)
- Sequential chapter numbering
- Rich text content editing

#### 👤 Characters Tab
- Character profiles with avatar support
- Role categorization (Protagonist, Antagonist, Supporting, Minor, Other)
- Detailed fields: personality, background, goals, description
- Image upload functionality

#### 🌍 World Building Tab
- Multiple element types: Location, Culture, Technology, Magic System, Organization, Historical Event
- Category filtering
- Significance tracking for story relevance
- Image support for visual reference

#### ⏱️ Timeline Tab
- Visual timeline with connecting line
- Event categorization (Plot, Character, World, Flashback, Foreshadowing)
- Timeframe specification
- Sequential ordering

#### 📝 Story Notes Tab
- Note categorization (Ideas, Research, Plot, Character, Setting, Themes, Dialogue, General)
- Tag support for better organization
- Category filtering
- Full-text content with preview

#### 📤 Story Import/Export
- **Story Export** - Export complete story to `.story` file format
- **Story Import** - Import `.story` files with all story elements
- **File Structure** - Preserves outline, chapters, characters, world building, timeline, and notes
- **Seamless Workflow** - Switch between screenplay and story work on the same project
- See [docs/EXPORT_FUNCTIONALITY.md](docs/EXPORT_FUNCTIONALITY.md) for details

### Shared Features

#### 🔐 Authentication & Security
- Email/Password authentication
- Google Sign-In
- Secure Firebase authentication
- User profiles with avatar support

#### 🔄 Public Sharing
Share your work with others via dedicated public sharing routes:
- **Public Script Views** - Share scripts with read-only access at `/user/{userId}/script/{scriptId}`
- **Public User Profiles** - Showcase your portfolio at `/user/{userId}`
- **Edit in App** - Script owners can quickly jump to editing mode

#### 🗑️ Selective Deletion
When deleting a script from the Profile view, choose exactly what to remove:
- Script document itself
- All characters
- All scenes
- All notes
- Or any combination of the above

#### ☁️ Cloud Sync
- Real-time synchronization with Firebase Firestore
- Automatic save as you type
- Access your work from any device
- Offline support (coming soon)

#### ⚙️ Comprehensive Settings Menu
Customize your writing experience with extensive preferences:
- **Theme Selection** - Light, Dark, or System/Auto mode with automatic detection
- **Export Defaults** - Set your preferred export format for quick exports
- **Editor Font Size** - Adjustable font size (12-24px) for comfortable writing
- **AI Features Toggle** - Show/hide AI-powered tools throughout the application
- **Privacy Controls** - Profile visibility and script sharing defaults
- **Language Selection** - Interface language (ready for future i18n support)
- **Project Linking** - Shared or separate projects between Script/Story Scribbler
- All settings persist automatically and take effect immediately
- See [SETTINGS_IMPLEMENTATION.md](SETTINGS_IMPLEMENTATION.md) for details

## 📖 Documentation

### Getting Started Guides
- **[Quick Start Card](docs/QUICK_START_CARD.md)** - Fix 403 errors in 4 steps (10 minutes)
- **[User Setup Instructions](docs/USER_SETUP_INSTRUCTIONS.md)** - Firebase Console setup ⭐ **START HERE**
- **[Setup Checklist](docs/SETUP_CHECKLIST.md)** - Complete setup verification

### User Guides
- **[Character Management](docs/CHARACTER_MANAGEMENT.md)** - How the Scrite-inspired character system works
- **[AI Editor Features](docs/AI_EDITOR_FEATURES.md)** - Comprehensive guide to AI-powered tools
- **[Export Functionality](docs/EXPORT_FUNCTIONALITY.md)** - Export formats and usage
- **[Troubleshooting 403 Errors](docs/TROUBLESHOOTING_403_ERRORS.md)** - Detailed troubleshooting guide

### Developer Documentation
- **[Implementation History](docs/IMPLEMENTATION_HISTORY.md)** - Major implementations and changes
- **[Development Notes](docs/DEVELOPMENT_NOTES.md)** - Guidelines, tasks, and technical notes
- **[Wiki](wiki/)** - Comprehensive wiki documentation (16 pages)

### Quick Links
- [Fountain Syntax Guide](https://fountain.io/) - Learn Fountain screenplay format
- [Firebase Console](https://console.firebase.google.com/) - Manage your Firebase project
- [Google Cloud Console](https://console.cloud.google.com/) - For Google Docs import setup

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
    *   **See [FIRESTORE_RULES_DEPLOYMENT.md](FIRESTORE_RULES_DEPLOYMENT.md) for comprehensive deployment guide**
    *   Quick deploy: `firebase deploy --only firestore:rules` (requires Firebase CLI)

5.  **Verify Environment Variables:** Check that `.env.local` has all required Firebase configuration.

**For detailed solutions with screenshots and step-by-step instructions, see [docs/TROUBLESHOOTING_403_ERRORS.md](docs/TROUBLESHOOTING_403_ERRORS.md)**

## Contributing

We welcome contributions to The Scribbler! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Fork the Repository** - Create your own fork of the project
2. **Create a Branch** - Make a feature branch from `main`
3. **Make Changes** - Implement your improvements
4. **Test Thoroughly** - Ensure your changes work and don't break existing features
5. **Submit a Pull Request** - Describe your changes clearly

### Development Guidelines

- Follow existing code style and patterns
- Use TypeScript with proper type definitions
- Write clear, descriptive commit messages
- Update documentation when adding features
- Test on multiple screen sizes
- Ensure accessibility standards are met

See [docs/DEVELOPMENT_NOTES.md](docs/DEVELOPMENT_NOTES.md) for detailed development guidelines and planned features.

### Reporting Issues

Found a bug or have a feature request?

1. Check if the issue already exists
2. Use the issue template if available
3. Provide clear reproduction steps for bugs
4. Include screenshots for UI issues
5. Specify your environment (OS, browser, Node version)

## Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) - React framework with server-side rendering
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **UI Components**: [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) - Cloud NoSQL database
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth) - User authentication
- **AI**: [Google Gemini](https://ai.google.dev/) - Generative AI for writing assistance
- **Deployment**: Firebase Hosting or Vercel

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Fountain** - [fountain.io](https://fountain.io/) for the screenplay markup specification
- **Scrite** - For character management inspiration
- **Firebase** - For backend infrastructure
- **Google Gemini** - For AI capabilities
- **Next.js Team** - For the excellent framework
- **Open Source Community** - For all the amazing libraries and tools

---

**Built with ❤️ for writers everywhere**

For questions, support, or feedback, please [open an issue](https://github.com/Kiyoshiakira/ScriptScribblerFS/issues) on GitHub.
