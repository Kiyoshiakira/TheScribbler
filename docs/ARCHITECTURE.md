# Architecture Documentation

This document describes the technical architecture of The Scribbler application.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Application Structure](#application-structure)
- [Data Architecture](#data-architecture)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Authentication Flow](#authentication-flow)
- [Data Flow](#data-flow)
- [Export System](#export-system)
- [AI Integration](#ai-integration)
- [Testing Strategy](#testing-strategy)

## Overview

The Scribbler is a **Single-Page Application (SPA)** built with modern web technologies, providing a seamless experience for screenplay and story writing with real-time collaboration capabilities.

### Key Architectural Decisions

1. **Next.js 15 App Router** - For server-side rendering, routing, and optimal performance
2. **Firebase Backend** - For authentication, real-time database, and hosting
3. **Local-First Architecture** - IndexedDB for offline support and sync queue
4. **Component-Based UI** - Radix UI primitives with Tailwind CSS
5. **TypeScript Throughout** - For type safety and better developer experience

## Technology Stack

### Frontend

- **Framework:** Next.js 15 (React 18)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS with custom components
- **UI Components:** Radix UI (accessible primitives)
- **State Management:** React Context + Hooks
- **Forms:** React Hook Form + Zod validation
- **Animations:** Tailwind CSS animations

### Backend & Services

- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth (Email/Password, Google)
- **Storage:** Firebase Storage (future)
- **AI:** Google Gemini API (via Genkit)
- **Real-time:** Firestore real-time listeners
- **Collaboration:** Yjs + WebSocket (experimental)

### Development Tools

- **Testing:** Jest (unit) + Playwright (E2E)
- **Linting:** ESLint with Next.js config
- **Type Checking:** TypeScript compiler
- **Package Manager:** npm
- **CI/CD:** GitHub Actions

## Application Structure

### Directory Layout

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main application (SPA)
│   ├── login/             # Authentication pages
│   ├── user/              # Public user profiles & scripts
│   ├── api/               # API routes
│   └── actions.ts         # Server actions
│
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── views/            # Feature views
│   │   ├── editor-view.tsx
│   │   ├── characters-view.tsx
│   │   └── ...
│   ├── script-editor.tsx
│   ├── rich-text-editor.tsx
│   └── ...
│
├── context/              # React Context providers
│   ├── script-context.tsx
│   ├── auth-context.tsx
│   └── settings-context.tsx
│
├── firebase/             # Firebase configuration
│   ├── index.ts         # Firebase initialization
│   ├── auth/            # Auth hooks and utilities
│   ├── firestore/       # Firestore hooks
│   └── errors.ts        # Error handling
│
├── hooks/                # Custom React hooks
│   ├── useAutosave.ts
│   ├── useGooglePicker.ts
│   └── ...
│
├── lib/                  # Utility libraries
│   ├── editor-types.ts
│   ├── export-pdf.ts
│   ├── export-fountain.ts
│   └── ...
│
├── services/             # Business logic
│   ├── aiProvider.ts
│   ├── collab/
│   └── ...
│
└── utils/                # Utility functions
    ├── exporters/        # Export implementations
    ├── saveManager.ts    # Local storage management
    └── diff.ts
```

### Route Structure

#### Main Application Routes

- `/` - Main SPA (requires authentication)
  - Tabbed interface with:
    - Dashboard
    - Editor
    - Logline
    - Scenes
    - Characters
    - Notes

#### Public Routes

- `/login` - Authentication page
- `/user/[userId]` - Public user profile
- `/user/[userId]/script/[scriptId]` - Public script view (read-only)
- `/import-scrite` - Scrite file converter

#### API Routes

- `/api/ai/*` - AI integration endpoints (via Genkit)

## Data Architecture

### Firestore Collections

```
firestore/
├── users/                      # User profiles
│   └── {userId}/
│       ├── profile data
│       └── settings
│
├── scripts/                    # Script documents
│   └── {scriptId}/
│       ├── metadata
│       ├── content
│       └── versions/           # Version history (future)
│
├── characters/                 # Character profiles
│   └── {characterId}/
│       ├── name, role, description
│       └── scriptId (reference)
│
├── scenes/                     # Scene metadata
│   └── {sceneId}/
│       ├── scene details
│       └── scriptId (reference)
│
├── notes/                      # Script notes
│   └── {noteId}/
│       ├── content
│       └── scriptId (reference)
│
├── stories/                    # Story projects
│   └── {storyId}/
│       ├── outline/
│       ├── chapters/
│       ├── characters/
│       ├── worldElements/
│       ├── timeline/
│       └── notes/
│
└── collaborativeSessions/      # Real-time collaboration
    └── {sessionId}/
        └── awareness data
```

### Data Model

#### Script Document

```typescript
interface Script {
  id: string
  userId: string
  title: string
  logline?: string
  content: ScriptBlock[]
  createdAt: Timestamp
  updatedAt: Timestamp
  isPublic: boolean
  metadata: {
    wordCount?: number
    pageCount?: number
    fountain?: string
  }
}

interface ScriptBlock {
  id: string
  type: 'scene' | 'action' | 'dialogue' | 'character' | 'parenthetical' | 'transition' | 'centered'
  content: string
  metadata?: {
    sceneHeading?: string
    sceneNumber?: number
    character?: string
  }
}
```

#### Character Document

```typescript
interface Character {
  id: string
  scriptId: string
  name: string
  role?: string
  description?: string
  scenes?: string[]  // Scene IDs where character appears
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### Local Storage (IndexedDB)

Used for offline support via `saveManager.ts`:

```typescript
interface Draft {
  id: string
  content: string
  timestamp: number
  synced: boolean
  metadata?: {
    title?: string
    type?: string
  }
}
```

**Stores:**
- `TheScribbler-Drafts` - Unsaved changes and offline drafts

## Component Architecture

### Component Hierarchy

```
App (page.tsx)
├── AuthProvider
│   └── ScriptProvider
│       └── SettingsProvider
│           └── MainApp
│               ├── Sidebar
│               │   ├── Tab: Dashboard
│               │   ├── Tab: Editor (EditorView)
│               │   ├── Tab: Logline (LoglineView)
│               │   ├── Tab: Scenes (ScenesView)
│               │   ├── Tab: Characters (CharactersView)
│               │   └── Tab: Notes (NotesView)
│               │
│               └── UserMenu
│                   ├── Profile (ProfileView)
│                   ├── Settings (SettingsDialog)
│                   └── Sign Out
```

### Key Components

#### ScriptEditor

The main screenplay editor component:
- Handles Fountain syntax
- Manages script blocks
- Auto-formatting
- Keyboard shortcuts
- Character tracking

#### RichTextEditor

Used for story chapters and notes:
- Quill-based editor
- Markdown support
- Formatting toolbar
- Auto-save integration

#### Views

Each sidebar tab is a "view" component:
- **EditorView** - Main script editor
- **CharactersView** - Character management
- **ScenesView** - Scene organization
- **NotesView** - Notes management
- **LoglineView** - Logline editor
- **ProfileView** - User profile & scripts

### UI Components

Built on Radix UI primitives:
- Button, Dialog, Dropdown, Select
- Accordion, Tabs, Toast
- Popover, Tooltip, Checkbox
- All fully accessible (WCAG 2.1 AA)

## State Management

### Context Providers

#### AuthContext

```typescript
interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}
```

#### ScriptContext

```typescript
interface ScriptContextType {
  currentScript: Script | null
  scripts: Script[]
  saveScript: (script: Script) => Promise<void>
  deleteScript: (id: string) => Promise<void>
  // ... other script operations
}
```

#### SettingsContext

```typescript
interface SettingsContextType {
  theme: 'light' | 'dark' | 'system'
  fontSize: number
  enableAI: boolean
  // ... other settings
}
```

### Local State

- Component state with `useState`
- Form state with `react-hook-form`
- Side effects with `useEffect`

### Server State

- Firestore data with custom hooks (`useDoc`, `useCollection`)
- Real-time synchronization
- Optimistic updates

## Authentication Flow

```
1. User visits app
   ↓
2. Check auth state (Firebase)
   ↓
3. If authenticated → Load main app
   If not → Redirect to /login
   ↓
4. User signs in (Email/Password or Google)
   ↓
5. Create/load user profile in Firestore
   ↓
6. Redirect to main app
   ↓
7. Load user's scripts and settings
```

### Security Rules

Firestore rules enforce:
- Users can only read/write their own data
- Public scripts are readable by all authenticated users
- Characters, scenes, notes tied to script ownership

## Data Flow

### Script Editing Flow

```
1. User types in editor
   ↓
2. Component state updates (React)
   ↓
3. Debounced autosave (useAutosave hook)
   ↓
4. Save to IndexedDB (local-first)
   ↓
5. Sync to Firestore
   ↓
6. Update UI on success/failure
```

### Offline Support Flow

```
1. User goes offline
   ↓
2. Changes saved to IndexedDB
   ↓
3. Sync queue tracks unsaved changes
   ↓
4. User comes back online
   ↓
5. Sync queue processes pending changes
   ↓
6. Upload to Firestore in order
   ↓
7. Mark as synced, remove from queue
```

## Export System

### Export Flow

```
1. User clicks export
   ↓
2. Select format (PDF, Fountain, FDX, etc.)
   ↓
3. Gather script data from Firestore
   ↓
4. Transform to target format
   ↓
5. Generate file (client-side)
   ↓
6. Download via browser
```

### Supported Formats

- **PDF** - Industry-standard screenplay format
- **Fountain** - Plain-text screenplay markup
- **Final Draft (FDX)** - XML format
- **DOCX** - Microsoft Word
- **EPUB** - E-book format
- **Markdown** - For stories
- **.scribbler** - Native format with all metadata

### Export Architecture

```
src/lib/
├── export-pdf.ts        # PDF generation (screenplay)
├── export-fountain.ts   # Fountain markup
├── export-fdx.ts        # Final Draft XML
└── ...

src/utils/exporters/
├── export-docx.ts       # Word document
├── export-epub.ts       # E-book
├── export-markdown.ts   # Markdown (stories)
└── export-story-pdf.ts  # PDF (stories)
```

## AI Integration

### Architecture

```
User Request
   ↓
Next.js API Route (/api/ai/*)
   ↓
Genkit Flow
   ↓
Google Gemini API
   ↓
Process Response
   ↓
Return to Client
```

### AI Features

- **Writing Assistant** - Suggestions and improvements
- **Script Analysis** - Feedback on structure and pacing
- **Character Development** - Character arc suggestions
- **Dialogue Polish** - Dialogue improvements
- **Scene Suggestions** - Story beat ideas

### AI Providers

Abstracted through `aiProvider.ts`:
- Google Gemini (default)
- Extensible for other providers

## Testing Strategy

### Unit Tests (Jest)

**What to test:**
- Utility functions (exporters, formatters)
- Business logic (saveManager, data transformations)
- Helper functions
- Type utilities

**Location:** `__tests__/` directories next to source files

### Integration Tests

**What to test:**
- Component interactions
- Context providers
- Firebase operations (mocked)
- API routes

### E2E Tests (Playwright)

**What to test:**
- User authentication flow
- Script creation and editing
- Export workflows
- Character and scene management
- Responsive design

**Location:** `e2e/` directory

### Coverage Goals

- **Overall:** 50%+
- **Critical paths:** 80%+
- **Business logic:** 70%+
- **UI components:** 40%+ (integration tests preferred)

## Performance Considerations

### Optimization Strategies

1. **Code Splitting** - Next.js automatic chunking
2. **Lazy Loading** - Dynamic imports for heavy components
3. **Image Optimization** - Next.js Image component
4. **Caching** - Service worker for static assets
5. **Debouncing** - For autosave and search
6. **Memoization** - React.memo for expensive renders
7. **Virtual Scrolling** - For long script lists

### Bundle Size

- Target: < 200KB initial bundle
- Lazy load: Editor components, export utilities, AI features
- Tree shaking: Automatic with Next.js

## Security

### Client-Side

- Input validation with Zod
- XSS prevention with DOMPurify
- HTTPS only
- Content Security Policy headers

### Server-Side

- Firestore security rules
- Firebase Auth for authentication
- Rate limiting on API routes
- Environment variable protection

## Scalability

### Current Limitations

- Single-user editing (no real-time collaboration yet)
- Client-side export generation
- Limited to Firebase free tier constraints

### Future Improvements

- Real-time collaboration with Yjs
- Server-side export generation
- Dedicated backend for heavy processing
- CDN for static assets
- Horizontal scaling with Firebase

## Deployment

### Build Process

```bash
npm run build  # Next.js production build
```

Output: `.next/` directory

### Hosting Options

1. **Firebase Hosting** (current)
   - Automatic SSL
   - Global CDN
   - Easy deployment

2. **Vercel** (alternative)
   - Optimal Next.js support
   - Auto-deployments from Git
   - Edge functions

### CI/CD Pipeline

GitHub Actions workflows:
- **test.yml** - Run tests on PR/push
- **build.yml** - Build verification
- **deploy.yml** (future) - Auto-deploy to production

## Monitoring & Logging

### Client-Side

- Console errors logged
- Firebase error tracking
- User analytics (future)

### Server-Side

- Firebase functions logs
- Firestore operation monitoring
- Performance metrics (future)

## Future Architecture Plans

1. **Real-time Collaboration** - Yjs + WebSocket integration
2. **Offline-First** - Enhanced PWA with service workers
3. **Plugin System** - Extensible architecture for custom tools
4. **Microservices** - Separate AI, export, and collaboration services
5. **GraphQL API** - For more efficient data fetching
6. **Edge Computing** - Deploy functions closer to users

---

**Last Updated:** November 2024
