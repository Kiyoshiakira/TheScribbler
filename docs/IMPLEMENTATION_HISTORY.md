# Implementation History

This document chronicles the major implementations and improvements made to ScriptScribbler.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Public Script Viewing and Sharing](#public-script-viewing-and-sharing)
- [Scene Blocks and Fountain Syntax](#scene-blocks-and-fountain-syntax)
- [Character Management System](#character-management-system)
- [Sidebar Organization](#sidebar-organization)
- [Story Scribbler Tool](#story-scribbler-tool)
- [Authentication and 403 Fixes](#authentication-and-403-fixes)

---

## Architecture Overview

ScriptScribbler is a **Single-Page Application (SPA)** with a **tabbed sidebar interface**.

### Main Application Structure

**Left Sidebar Tabs:**
1. **Dashboard** - Script management hub
2. **Editor** - Screenplay editor
3. **Logline** - Story summary editor
4. **Scenes** - Scene organization
5. **Characters** - Character management
6. **Notes** - Notes and ideas

**Top-Right User Menu:**
- **Profile** - User profile and script management
- **Settings** - Application settings
- **Sign Out** - User logout

### Additional Routes

**Public Sharing Routes** (separate from main app):
- `/user/{userId}` - Public user profile view
- `/user/{userId}/script/{scriptId}` - Public script view (read-only)

**Utility Routes:**
- `/import-scrite` - Scrite to Fountain converter tool
- `/login` - Authentication page

### Key Architecture Decisions

**Why Profile is Not in Sidebar:**
- It's an account management function, not a script editing function
- The sidebar is focused on screenplay creation and organization
- Profile is accessed less frequently than script-related tabs
- Standard UX pattern places account settings in top-right menu

**Why Public Routes are Separate:**
- They serve a different purpose (sharing vs. editing)
- They have different permission models (read-only vs. read-write)
- They need to work without the full app context
- They're accessed via direct links, not internal navigation

---

## Public Script Viewing and Sharing

**Date:** November 2024

### Overview
Added public script viewing capabilities via dedicated routes (outside the main app), clarified the upload functionality, and improved the user experience around script management.

### Changes Made

#### 1. Firestore Security Rules
- Updated all script-related rules to allow authenticated users to read scripts
- Maintained owner-only write permissions for security
- Applied to: scripts, versions, characters, scenes, notes, and comments

#### 2. Public User Profile Route
**Route:** `/user/[userId]` (Standalone, outside main app)

**Features:**
- Displays user profile information (avatar, bio, cover image)
- Lists all user's scripts with last modified dates
- "View Script" button for each script
- Navigation back to the main app
- Read-only for all users

#### 3. Public Script View Route
**Route:** `/user/[userId]/script/[scriptId]` (Standalone, outside main app)

**Features:**
- Full read-only script view with tabs for:
  - Script content (formatted as code/screenplay)
  - Characters list with descriptions
  - Scenes list with details
  - Notes with markdown rendering
- Shows script metadata (title, logline, last modified)
- "Edit in App" button for script owners
- Navigation back to user profile

#### 4. Profile View Updates
**Changes:**
- Reorganized script card buttons for better UX
- Added "View" button that opens script in new tab (public sharing route)
- Renamed "Open" to "Edit" for clarity (opens in Editor tab)
- Separated Delete button to its own row

**Button Layout:**
```
[Edit] (opens Editor tab)  [View] (opens public sharing route)
[Delete]
```

#### 5. Upload/Import Clarification
- Updated Import menu item text from "Import from file..." to "Import .scrite or .scribbler file"

### Security
- ✅ All scripts readable by authenticated users only
- ✅ Write access restricted to owners
- ✅ No security vulnerabilities found
- ✅ Proper null checking and error handling

---

## Scene Blocks and Fountain Syntax

**Date:** November 2024

### Overview
Added Scrite-like scene blocks and enhanced Fountain syntax support to the ScriptScribbler screenplay editor.

### Problem Statement
Fix editor tab to work as a screenplay editor like fountain, similar to scrite, and add scene blocks similar to scrite.

### Solution

#### 1. Scene Blocks (Scrite-like Feature)
The editor now groups screenplay content into visual scene blocks:

**Features:**
- Automatic scene grouping based on scene headings
- Collapsible/expandable scenes for easier navigation
- Scene metadata display:
  - Scene number
  - Setting/location (with MapPin icon)
  - Estimated time (with Clock icon)
  - Scene description
- Visual hierarchy with border and background colors
- Hover effects for better UX
- Shows block count when collapsed

**Implementation:**
- New `SceneBlock` component
- Modified `ScriptEditor` to automatically group blocks by scene
- Maintains all existing editor features (highlighting, find/replace)

#### 2. Enhanced Fountain Syntax Support

**New Block Types:**
1. **Centered Text**: `> THE END <`
   - For centered titles, chapter markers, etc.
   - Styled with center alignment and medium font weight

2. **Section Headings**: `# Act One`
   - For organizing screenplay into sections/acts
   - Styled as large, bold, primary-colored text
   - Supports multiple # for different heading levels

3. **Synopsis**: `= This scene introduces the hero`
   - For scene descriptions and notes
   - Styled as italic, muted text with left border
   - Smaller font size to distinguish from action

**Existing Fountain Support (Enhanced):**
- Scene headings (INT./EXT., I/E, forced with .)
- Action/description blocks
- Character names (with V.O. and O.S. support)
- Dialogue
- Parentheticals
- Transitions (CUT TO:, FADE OUT:, etc.)

### Files Modified
1. `src/components/scene-block.tsx` (NEW)
2. `src/components/script-editor.tsx`
3. `src/lib/screenplay-parser.ts`
4. `src/lib/editor-types.ts`
5. `src/components/script-block.tsx`
6. `src/context/script-context.tsx`
7. `src/ai/flows/ai-agent-orchestrator.ts`

### Benefits
1. **Better Organization**: Scene blocks provide clear visual structure
2. **Easier Navigation**: Collapse scenes to focus on specific parts
3. **Enhanced Fountain**: Full support for Fountain syntax
4. **Scrite-like UX**: Familiar interface for Scrite users
5. **Metadata Display**: See scene info at a glance
6. **Improved Workflow**: Faster screenplay writing and editing

---

## Character Management System

**Date:** November 2024

### Overview
Implemented a Scrite-inspired character management system that prevents accidental data loss and provides professional workflow.

### Problem Statement
The character tab is connected to the Editor tab, which probably prevents successful deletion. How does Scrite handle its characters? Apply a similar way of character management.

### Research Findings
After researching Scrite's character management approach:
1. **Characters persist independently** from script content
2. **No automatic deletion** when characters are removed from scenes
3. Characters must be **manually deleted** by users
4. This prevents **accidental data loss** of character profiles, descriptions, and portraits

### Solution Implemented

**Before:**
```typescript
// Delete characters that no longer appear in the script
existingCharactersMap.forEach((character) => {
  if (character.id) {
    const charRef = doc(charactersCollectionRef, character.id);
    batch.delete(charRef);  // ❌ Auto-deletion
  }
});
```

**After:**
```typescript
// Update scene count to 0 for characters that no longer appear in the script
// (but don't delete them - user must manually delete if desired, similar to Scrite)
existingCharactersMap.forEach((character) => {
  if (character.id && character.scenes !== 0) {
    const charRef = doc(charactersCollectionRef, character.id);
    batch.set(charRef, { scenes: 0 }, { merge: true });  // ✅ Update only
  }
});
```

### New Behavior

**Character Lifecycle:**
1. **Creation**: Automatic when character first appears in dialogue
2. **Updates**: Automatic scene count tracking
3. **Removal from Script**: Scene count set to 0 (character persists)
4. **Deletion**: Manual only from Characters tab

### Benefits
1. **Prevents Data Loss**: Character profiles safe during script restructuring
2. **User Control**: Explicit deletion intent required
3. **Professional Workflow**: Matches industry-standard software (Scrite)
4. **Flexibility**: Easy to recover characters by adding dialogue back
5. **Clear State**: Scene count of 0 indicates unused characters

### Comparison with Scrite

| Feature | Scrite | ScriptScribbler |
|---------|--------|----------------|
| Auto-create characters | ✅ | ✅ |
| Auto-delete characters | ❌ | ❌ |
| Scene tracking | ✅ | ✅ |
| Manual deletion required | ✅ | ✅ |
| Character profiles persist | ✅ | ✅ |

---

## Sidebar Organization

**Date:** November 2024

### Overview
Fixed the application structure to properly reflect that it's a Single-Page Application with tabbed sidebar interface, not multiple web pages.

### Problem Statement
The application doesn't have pages like a website does. It has tabs you can switch to from the left sidebar. Additionally, the profile shouldn't be on the sidebar on the left, only available on the top right profile circle.

### Changes Made

#### 1. Code Changes
**File: `src/components/layout/AppLayout.tsx`**
- Updated initial view to default to `'dashboard'` instead of profile
- Updated `handleSetView` to remove fallback to profile
- Updated `renderView` to default to Dashboard when no script is loaded
- Added clarifying comments about Profile being accessible only via top-right menu

#### 2. Documentation Updates
- **README.md**: Added "Application Architecture" section
- **IMPLEMENTATION_NOTES.md**: Updated terminology from "pages" to proper terms
- **public/APP_FEATURES.md**: Removed Profile from sidebar tab list

### Architecture Summary

**Main Application (Left Sidebar):**
1. Dashboard - Script management
2. Editor - Screenplay editing
3. Logline - Story summaries
4. Scenes - Scene organization
5. Characters - Character management
6. Notes - Ideas and research

**Top-Right User Menu:**
- Profile (view and manage scripts, edit profile)
- Settings (app configuration)
- Sign Out (logout)

### Benefits
1. **Clearer Architecture**: Documentation accurately reflects tab-based design
2. **Better UX**: Profile in top-right menu follows standard patterns
3. **Focused Sidebar**: Sidebar contains only script-related functionality
4. **Consistent Terminology**: All docs use proper terms

---

## Story Scribbler Tool

**Date:** November 2024

### Overview
Transformed the Story Scribbler tool from a placeholder view into a fully functional tab-based story writing and organization tool.

### Features Implemented

#### 1. Outline Tab
- Hierarchical story structure with parent-child relationships
- Expandable/collapsible sections
- Order management for outline items
- Full CRUD operations with Firestore integration

#### 2. Chapters Tab
- Chapter cards with title, summary, and content
- Automatic word count tracking per chapter and total
- Sequential chapter numbering
- Rich text content editing area

#### 3. Characters Tab
- Character profiles with avatar support
- Role categorization (Protagonist, Antagonist, Supporting, Minor, Other)
- Detailed fields: personality, background, goals, description
- Image upload functionality
- Grid layout with character cards

#### 4. World Building Tab
- Multiple element types: Location, Culture, Technology, Magic System, Organization, Historical Event
- Category filtering
- Significance tracking for story relevance
- Image support for visual reference

#### 5. Timeline Tab
- Visual timeline with connecting line
- Event categorization (Plot, Character, World, Flashback, Foreshadowing)
- Timeframe specification
- Sequential ordering
- Category filtering

#### 6. Story Notes Tab
- Note categorization (Ideas, Research, Plot, Character, Setting, Themes, Dialogue, General)
- Tag support for better organization
- Category filtering
- Full-text content
- Card preview with line clamping

### Technical Implementation

**Architecture:**
- Component Structure: Modular tab components with shared patterns
- State Management: React hooks with Firestore real-time updates
- UI Components: Radix UI for accessible components
- Styling: Tailwind CSS for responsive design
- Database: Firestore collections per tab under user's script

**Firestore Schema:**
```
/users/{userId}/scripts/{scriptId}/
  ├─ outline/          - Outline items
  ├─ chapters/         - Story chapters
  ├─ storyCharacters/  - Character profiles
  ├─ worldBuilding/    - World elements
  ├─ timeline/         - Timeline events
  └─ storyNotes/       - Story notes
```

### Files Created
- `src/components/views/story-scribbler-view.tsx` (modified from placeholder)
- `src/components/views/story-tabs/outline-tab.tsx`
- `src/components/views/story-tabs/chapters-tab.tsx`
- `src/components/views/story-tabs/story-characters-tab.tsx`
- `src/components/views/story-tabs/world-building-tab.tsx`
- `src/components/views/story-tabs/timeline-tab.tsx`
- `src/components/views/story-tabs/story-notes-tab.tsx`

### Total Changes
- **8 files changed**
- **2,542 lines added**

---

## Authentication and 403 Fixes

**Date:** November 2024

### Overview
Fixed 403 authentication errors and improved the user experience when setting up ScriptScribbler.

### Problems Addressed

#### 1. Google Sign-In 403 Errors
**Issue:** Users encountered "403 That's an error" page when trying to sign in with Google.
**Root Cause:** Development domains were not authorized in Firebase Console.
**Solution:** 
- Added clear error messages explaining the issue
- Created detailed documentation on how to add authorized domains
- Provided step-by-step instructions in Firebase Console

#### 2. Email/Password Authentication Failures
**Issue:** Users could not sign up or sign in with email/password.
**Root Cause:** Email/Password provider not enabled in Firebase Console.
**Solution:**
- Added specific error message for `auth/operation-not-allowed`
- Created documentation explaining how to enable the provider
- Improved error handling to guide users to the solution

#### 3. OAuth Consent Screen Issues
**Issue:** Google Drive and Docs scopes caused 403 errors for users without OAuth consent screen configured.
**Solution:**
- Documented that Drive/Docs scopes are optional
- Provided instructions for OAuth consent screen setup
- Added option to disable scopes temporarily

#### 4. Poor Error Messages
**Issue:** Generic error messages didn't help users understand or fix the problem.
**Solution:**
- Implemented comprehensive error handling for all common error codes
- Provided actionable error messages with clear instructions
- Added references to detailed documentation

### Code Changes

**File: `src/app/login/page.tsx`**

Enhanced error handling for both Google sign-in and Email/Password authentication with specific, actionable error messages.

**Example Before:**
```
Title: "Google Sign-In Error"
Description: "Failed to sign in with Google."
```

**Example After:**
```
Title: "Domain Not Authorized"
Description: "Your domain is not authorized for Google Sign-In. Please add your 
domain (e.g., localhost or your workspace domain) to the authorized domains list 
in Firebase Console under Authentication > Sign-in method > Authorized domains."
```

### Documentation Created
- `docs/USER_SETUP_INSTRUCTIONS.md` - Required Firebase Console setup
- `docs/SETUP_CHECKLIST.md` - Complete setup verification
- `docs/TROUBLESHOOTING_403_ERRORS.md` - Detailed troubleshooting
- Updated README.md with setup flow and links

### User Instructions Summary

**Required Steps:**
1. ✅ Enable Email/Password authentication in Firebase Console
2. ✅ Enable Google authentication in Firebase Console  
3. ✅ Add authorized domains (localhost, production, cloud workspace)
4. ✅ Create Firestore database
5. ✅ Set up environment variables in `.env.local`

**Optional Steps (for Google Docs Import):**
6. ⚙️ Configure OAuth consent screen in Google Cloud Console
7. ⚙️ Add Drive/Docs scopes
8. ⚙️ Add test users

### Benefits

**For New Users:**
- Clear setup path from start to finish
- Specific error messages that explain what's wrong
- Step-by-step instructions to fix issues
- Reduced setup time and frustration

**For Troubleshooting:**
- Comprehensive guide for all 403 scenarios
- Quick reference for error codes
- Multiple documentation levels

---

## Conclusion

These implementations have transformed ScriptScribbler into a comprehensive, professional screenplay and story writing tool with:
- ✅ Industry-standard screenplay editing features
- ✅ Scrite-inspired character management
- ✅ Public script sharing capabilities
- ✅ Full story development tools
- ✅ Clear architecture and documentation
- ✅ Improved authentication and error handling
- ✅ User-friendly setup process

The application now provides writers with powerful tools for both screenplay and story development while maintaining professional workflows and preventing data loss.
