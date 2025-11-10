# Application Architecture

This document provides a comprehensive overview of ScriptScribbler's application architecture, design decisions, and structural organization.

## Architecture Overview

ScriptScribbler is a **Single-Page Application (SPA)** with a **tabbed sidebar interface**, built using modern web technologies.

### Technology Stack

**Frontend:**
- **Framework**: Next.js (React-based)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui
- **State Management**: React Context API

**Backend:**
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **AI Integration**: Google Gemini via Genkit
- **Hosting**: Firebase Hosting / Vercel

**Development:**
- **Build Tool**: Next.js with Turbopack
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript

## Application Type

### Single-Page Application (SPA)

ScriptScribbler is a **single-page application** that loads once and dynamically updates content without full page reloads.

**Benefits:**
- Fast, responsive user experience
- Smooth transitions between views
- Persistent application state
- No page refresh delays
- Desktop-app-like feel

**Implementation:**
- React-based routing
- Dynamic view switching
- Client-side navigation
- State preservation across views

## Main Application Structure

### Left Sidebar Tabs

The main application uses tabs in the left sidebar for navigation between different views:

#### 1. 📊 Dashboard Tab
**Purpose:** Script management hub

**Features:**
- View all scripts
- Create new projects
- Access recent work
- Script statistics
- Quick actions

**Route:** Internal view (no URL change)

#### 2. ✍️ Editor Tab
**Purpose:** Screenplay editor

**Features:**
- Full-featured screenplay writing
- Fountain syntax support
- Scene blocks
- AI assistance
- Real-time formatting

**Route:** Internal view (no URL change)

#### 3. 📝 Logline Tab
**Purpose:** Story summary editor

**Features:**
- Create loglines
- AI generation
- Multiple variations
- Export with script

**Route:** Internal view (no URL change)

#### 4. 🎬 Scenes Tab
**Purpose:** Scene organization

**Features:**
- Scene list view
- Beatboard visualization
- Reorder scenes
- Edit scene metadata
- Track scene progression

**Route:** Internal view (no URL change)

#### 5. 👥 Characters Tab
**Purpose:** Character management

**Features:**
- Character list
- Profiles and portraits
- Scene appearance tracking
- AI-generated profiles
- Independent persistence

**Route:** Internal view (no URL change)

#### 6. 📋 Notes Tab
**Purpose:** Notes and ideas

**Features:**
- Production notes
- Research organization
- Category-based sorting
- AI-generated notes
- Digital corkboard

**Route:** Internal view (no URL change)

### Top-Right User Menu

Profile and Settings are accessed via the user avatar menu in the top-right corner:

#### 👤 Profile
**Purpose:** User profile and script management

**Features:**
- User information
- Script portfolio
- Delete scripts
- Manage account

**Access:** Click avatar → Profile

#### ⚙️ Settings
**Purpose:** Application settings

**Features:**
- Application preferences
- Theme settings (future)
- Export defaults (future)
- Privacy settings (future)

**Access:** Click avatar → Settings

#### 🚪 Sign Out
**Purpose:** User logout

**Access:** Click avatar → Sign Out

## Why This Architecture?

### Profile Not in Sidebar

The Profile view is intentionally **not** included in the left sidebar because:

1. **Account Management**: Profile is an account function, not a script editing function
2. **Focus**: The sidebar focuses on screenplay creation and organization
3. **Frequency**: Profile is accessed less frequently than script-related tabs
4. **UX Pattern**: Standard UX places account settings in top-right menu
5. **Screen Space**: Keeps sidebar focused on writing tools

### Tabbed Sidebar Design

Benefits of the tabbed sidebar approach:

1. **Quick Navigation**: Switch views without page loads
2. **Context Preservation**: Maintain work state across views
3. **Visual Clarity**: Clear indication of current view
4. **Familiar Pattern**: Similar to popular creative software
5. **Efficient Workflow**: All tools accessible from one place

## Additional Routes

### Public Sharing Routes

These are **separate standalone routes** (not part of the main app) for sharing content:

#### `/user/{userId}`
**Purpose:** Public user profile view

**Features:**
- User's script portfolio
- Public projects
- Writer information
- Shareable link

**Access:** Direct link (outside main app)

**Permissions:** Read-only, public access

#### `/user/{userId}/script/{scriptId}`
**Purpose:** Public script view

**Features:**
- Read-only script view
- Characters included
- Scenes included
- Notes included

**Access:** Direct link (outside main app)

**Permissions:** Read-only, public access

**Use Cases:**
- Share with producers
- Share with agents
- Share with collaborators
- Portfolio presentation

### Utility Routes

Standalone tools separate from the main application:

#### `/import-scrite`
**Purpose:** Scrite to Fountain converter tool

**Features:**
- File upload
- Format conversion
- Standalone utility

**Access:** Direct link

#### `/login`
**Purpose:** Authentication page

**Features:**
- Email/password login
- Google sign-in
- Account creation

**Access:** Direct link (pre-authentication)

## Why Public Routes are Separate

Public sharing routes are separate from the main app because:

1. **Different Purpose**: Sharing vs. editing
2. **Permission Model**: Read-only vs. read-write
3. **No App Context**: Don't need full app functionality
4. **Direct Access**: Accessed via direct links, not internal navigation
5. **Performance**: Lighter-weight pages for sharing
6. **SEO**: Better for search engine indexing

## Code Structure

### Directory Organization

```
src/
├── app/                      # Next.js app directory
│   ├── page.tsx              # Main app entry
│   ├── login/                # Login route
│   └── user/                 # Public sharing routes
│       └── [userId]/
│           ├── page.tsx      # User profile
│           └── script/[scriptId]/
│               └── page.tsx  # Public script view
├── components/               # React components
│   ├── layout/
│   │   ├── AppLayout.tsx     # Main app layout
│   │   ├── app-sidebar.tsx   # Sidebar with tabs
│   │   └── app-header.tsx    # Header with user menu
│   ├── views/                # View components
│   │   ├── dashboard.tsx
│   │   ├── editor.tsx
│   │   ├── scenes.tsx
│   │   ├── characters.tsx
│   │   ├── notes.tsx
│   │   └── logline.tsx
│   └── ...                   # Other components
├── context/                  # React Context providers
│   ├── auth-context.tsx      # Authentication state
│   ├── script-context.tsx    # Script state
│   └── ...
├── lib/                      # Utilities and helpers
│   ├── firebase.ts           # Firebase config
│   ├── screenplay-parser.ts  # Fountain parser
│   └── ...
├── ai/                       # AI integration
│   ├── flows/                # AI flows
│   └── genkit.ts             # Genkit setup
└── hooks/                    # Custom React hooks
```

### View Type

The View type includes all accessible views:

```typescript
export type View = 
  | 'dashboard' 
  | 'editor' 
  | 'scenes' 
  | 'characters' 
  | 'notes' 
  | 'logline' 
  | 'profile';
```

**Note:** `'profile'` is included because it's a valid view, even though it's only accessible via the user menu, not the sidebar.

## User Experience Flow

### Normal Workflow

1. **Login**: User authenticates
2. **Dashboard**: App loads with Dashboard view by default
3. **Navigation**: User navigates between tabs using left sidebar
4. **Profile Access**: User accesses Profile via top-right avatar menu when needed
5. **Script Creation**: User creates/edits scripts using Editor tab
6. **Organization**: User organizes content using Scenes, Characters, Notes tabs
7. **Export/Share**: User exports or shares their work

### Sharing Workflow

1. **Profile View**: User clicks "View" button on a script in Profile view
2. **Public Route**: Opens public sharing route in new tab (`/user/{userId}/script/{scriptId}`)
3. **URL Copy**: User copies URL to share with others
4. **Recipient Access**: Recipients can view (but not edit) the script
5. **Portfolio**: Public user profile shows portfolio of shared scripts

### Collaboration Workflow (Future)

1. **Share Link**: Owner shares public script URL
2. **View Access**: Collaborators view read-only version
3. **Feedback**: Comments/notes shared externally
4. **Updates**: Owner makes edits in main app
5. **Sync**: Public view updates with changes

## Terminology Guide

### Correct Terms

Use these terms when describing the application:

✅ **Tab** - Items in the left sidebar (Dashboard, Editor, etc.)
✅ **View** - The rendered content when a tab is selected
✅ **Route** - URL paths (both internal views and external pages)
✅ **Public sharing route** - URLs for sharing scripts externally (`/user/...`)
✅ **User menu** - Avatar menu in top-right corner
✅ **Sidebar** - Left panel with tabs

### Terms to Avoid

❌ **Don't use:**
- "Page" when referring to sidebar tabs
- "Web page" when referring to views in the main app

✅ **Use instead:**
- "Tab" or "view" for sidebar items
- "Route" or "public sharing route" for `/user/...` paths

## Design Decisions

### Why SPA?

**Benefits:**
- Fast user experience
- No page reload delays
- Smooth transitions
- State persistence
- Desktop-app feel

**Trade-offs:**
- Initial load time (mitigated with code splitting)
- SEO challenges (solved with Next.js SSR for public routes)
- Browser history management (handled by Next.js router)

### Why Tabbed Interface?

**Benefits:**
- Familiar pattern (similar to VS Code, Figma)
- Quick navigation
- Visual clarity
- Efficient workflow
- Context preservation

**Inspiration:**
- Scrite (screenplay software)
- VS Code (editor)
- Figma (design tool)

### Why Separate Public Routes?

**Benefits:**
- Cleaner architecture
- Better performance for sharing
- SEO optimization
- Security separation
- Lighter-weight pages

## State Management

### React Context API

**Used For:**
- Authentication state (`AuthContext`)
- Current script state (`ScriptContext`)
- User preferences (`PreferencesContext`)
- View navigation state

**Benefits:**
- No external dependencies
- Simple and lightweight
- Built-in to React
- Easy to understand

### Local State

**Used For:**
- Component-specific UI state
- Form inputs
- Temporary data

**Implementation:**
- React `useState`
- React `useReducer` for complex state

### Server State

**Used For:**
- Firebase data
- Real-time updates

**Implementation:**
- Firebase Firestore listeners
- React Query (future consideration)

## Performance Optimizations

### Code Splitting

- Dynamic imports for heavy components
- Route-based splitting
- Lazy loading for non-critical features

### Memoization

- `React.memo` for expensive components
- `useMemo` for expensive calculations
- `useCallback` for function stability

### Debouncing

- Auto-save debounced (1 second)
- Search queries debounced
- AI requests debounced

### Virtualization

- Future: Virtual scrolling for large scripts
- Future: Virtual lists for character/scene lists

## Security Considerations

### Authentication

- Firebase Authentication
- Email/password + Google OAuth
- Secure session management
- Token-based API calls

### Authorization

- Firestore security rules
- Owner-only write access
- Public read access for shared scripts
- Server-side validation

### Data Protection

- Environment variables for secrets
- No API keys in client code
- HTTPS only
- Secure Firebase configuration

## Scalability

### Current Scale

- Supports: Individual writers and small teams
- Scripts: Unlimited per user
- Size: Scripts up to 1M tokens

### Future Scale Plans

- Real-time collaboration
- Team workspaces
- Version history
- Cloud storage integration

---

**Related Pages:**
- [Application Features](Application-Features) - Overview of features
- [Getting Started](Getting-Started) - Setup and installation
- [Development Blueprint](Development-Blueprint) - Project vision

---

**💡 Architecture Insight:** The tabbed sidebar SPA design allows for a fluid writing experience while maintaining clear organization of screenplay elements.
