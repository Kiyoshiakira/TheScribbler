# Settings Testing Guide

## Overview

This document provides comprehensive testing procedures for The Scribbler's Settings dialog. It covers all settings toggles, verification of application-wide updates, and persistence across reloads.

## Settings Location

The Settings dialog can be accessed from:
- **Path**: Top-right user avatar → Settings menu item
- **Component**: `src/components/settings-dialog.tsx`
- **Context**: `src/context/settings-context.tsx`
- **Theme Provider**: `src/context/theme-provider.tsx`

## Settings Categories

The Settings dialog is organized into 4 tabs:
1. **General** - Theme, Export Format, Language
2. **Editor** - Font Size, AI Features
3. **Privacy** - Profile Visibility, Script Sharing
4. **Advanced** - Project Linking, AI Model Info, Feedback, Debugging

---

## Test Cases

### 1. Theme Toggle Testing

**Location**: General Tab → Theme

#### Test Case 1.1: Light Theme
**Steps:**
1. Open Settings dialog
2. Navigate to General tab
3. Select "Light" theme option
4. Close the dialog
5. Observe the application UI

**Expected Results:**
- ✅ Application switches to light color scheme immediately
- ✅ Background is light colored
- ✅ Text is dark for readability
- ✅ All UI components use light theme colors
- ✅ Setting persists after page reload

**Integration Points:**
- Document root receives `class="light"`
- All components using Tailwind dark mode classes respond correctly

#### Test Case 1.2: Dark Theme
**Steps:**
1. Open Settings dialog
2. Navigate to General tab
3. Select "Dark" theme option
4. Close the dialog
5. Observe the application UI

**Expected Results:**
- ✅ Application switches to dark color scheme immediately
- ✅ Background is dark colored
- ✅ Text is light for readability
- ✅ All UI components use dark theme colors
- ✅ Setting persists after page reload

**Integration Points:**
- Document root receives `class="dark"`
- All components using Tailwind dark mode classes respond correctly

#### Test Case 1.3: System/Auto Theme
**Steps:**
1. Open Settings dialog
2. Navigate to General tab
3. Select "System/Auto" theme option
4. Close the dialog
5. Change your OS theme preference (if possible)

**Expected Results:**
- ✅ Application matches system preference initially
- ✅ When system preference changes, app theme updates automatically
- ✅ Theme preference queries `(prefers-color-scheme: dark)` media query
- ✅ Setting persists after page reload

**Integration Points:**
- Theme provider listens to `matchMedia('(prefers-color-scheme: dark)')` changes
- Event listener properly attached/detached

#### Test Case 1.4: Theme Persistence
**Steps:**
1. Set theme to "Dark"
2. Reload the page (F5 or Ctrl+R)
3. Observe if dark theme is still applied

**Expected Results:**
- ✅ Theme setting is remembered from localStorage
- ✅ No flash of wrong theme on page load
- ✅ Theme applies before content renders

**Storage Key:** `scriptscribbler-settings` in localStorage

---

### 2. Export Format Testing

**Location**: General Tab → Default Export Format

#### Test Case 2.1: Setting Default Export Format
**Steps:**
1. Open Settings dialog
2. Navigate to General tab
3. Select different export formats one by one:
   - PDF
   - Fountain
   - Final Draft (.fdx)
   - Plain Text (.txt)
   - Scribbler (.scribbler)
   - Google Docs

**Expected Results:**
- ✅ Selection updates immediately in the dropdown
- ✅ Setting persists after page reload

#### Test Case 2.2: Quick Export Uses Default Format
**Steps:**
1. Set default export format to "Fountain"
2. Close Settings dialog
3. Navigate to a script in Editor view
4. Click the Export dropdown in the header
5. Observe the "Quick Export" option

**Expected Results:**
- ✅ Quick Export shows "Export as Fountain (Default)"
- ✅ Clicking Quick Export triggers Fountain export
- ✅ All format options still available in "All Formats" section

**Integration Points:**
- `src/components/layout/app-header.tsx` reads `settings.exportFormat`
- Export dropdown shows correct default format label
- Clicking quick export calls the correct export function

#### Test Case 2.3: Export Format Persistence
**Steps:**
1. Set default format to "Final Draft"
2. Reload the page
3. Check export dropdown

**Expected Results:**
- ✅ Quick Export still shows "Export as Final Draft (Default)"
- ✅ Setting is correctly loaded from localStorage

---

### 3. Editor Font Size Testing

**Location**: Editor Tab → Editor Font Size

#### Test Case 3.1: Adjust Font Size with Slider
**Steps:**
1. Open Settings dialog
2. Navigate to Editor tab
3. Move the font size slider to different positions:
   - Minimum (12px)
   - Middle (~18px)
   - Maximum (24px)
4. Keep dialog open and observe the editor in the background

**Expected Results:**
- ✅ Current font size value displays next to slider (e.g., "16px")
- ✅ Font size updates as slider moves
- ✅ Text in script editor changes size in real-time
- ✅ Font size is readable at all positions (12-24px)

**Integration Points:**
- `src/components/script-editor.tsx` reads `settings.editorFontSize`
- Font size applied via inline styles to editor container
- Default value is 16px if not set

#### Test Case 3.2: Font Size Persistence
**Steps:**
1. Set font size to 20px
2. Close Settings dialog
3. Reload the page
4. Observe editor font size

**Expected Results:**
- ✅ Font size remains at 20px after reload
- ✅ Slider shows correct position when Settings reopened
- ✅ Setting correctly stored in localStorage

#### Test Case 3.3: Font Size Affects All Content
**Steps:**
1. Set font size to 14px
2. Navigate through different script blocks:
   - Scene headings
   - Action lines
   - Dialogue
   - Character names
3. Observe text size in each block type

**Expected Results:**
- ✅ All block types respect the font size setting
- ✅ Relative sizing maintained (e.g., headings still larger than action)
- ✅ Font size affects all editor content uniformly

---

### 4. AI Features Toggle Testing

**Location**: Editor Tab → AI Features

#### Test Case 4.1: Disable AI Features
**Steps:**
1. Open Settings dialog
2. Navigate to Editor tab
3. Toggle "AI Features" switch to OFF
4. Close Settings dialog
5. Navigate to Editor view
6. Select text in a script block

**Expected Results:**
- ✅ AI context menu does NOT appear on text selection
- ✅ AI FAB (floating action button) is hidden in editor view
- ✅ Other editor functionality remains intact

**Integration Points:**
- `src/components/script-block.tsx` checks `settings.aiFeatureEnabled`
- `src/components/views/editor-view.tsx` conditionally renders AI FAB
- Default value is `true` (enabled) for backwards compatibility

#### Test Case 4.2: Enable AI Features
**Steps:**
1. With AI features disabled, open Settings
2. Navigate to Editor tab
3. Toggle "AI Features" switch to ON
4. Close Settings dialog
5. Navigate to Editor view
6. Select text in a script block

**Expected Results:**
- ✅ AI context menu appears on text selection
- ✅ AI FAB is visible in editor view
- ✅ AI features are fully functional

#### Test Case 4.3: AI Toggle Persistence
**Steps:**
1. Disable AI features
2. Reload the page
3. Try to access AI features

**Expected Results:**
- ✅ AI features remain disabled after reload
- ✅ Setting correctly loaded from localStorage
- ✅ Toggle shows correct state when Settings reopened

---

### 5. Privacy Controls Testing

**Location**: Privacy Tab

#### Test Case 5.1: Public Profile Toggle
**Steps:**
1. Open Settings dialog
2. Navigate to Privacy tab
3. Toggle "Public Profile" switch ON and OFF
4. Observe the switch state

**Expected Results:**
- ✅ Switch toggles between ON and OFF states
- ✅ Setting persists after page reload
- ✅ Default state is ON (public profile)

**Future Integration:**
- When privacy features are implemented, this will control profile visibility
- Public profiles accessible at `/user/{userId}` route
- Private profiles return 404 or access denied for non-owners

#### Test Case 5.2: Default Script Sharing
**Steps:**
1. Open Settings dialog
2. Navigate to Privacy tab
3. Select "Private" for Default Script Sharing
4. Read the description
5. Select "Public"
6. Read the description

**Expected Results:**
- ✅ Radio button selection updates immediately
- ✅ Descriptions clearly explain each option:
  - Private: "New scripts are only visible to you by default"
  - Public: "New scripts are visible to all users by default"
- ✅ Setting persists after page reload
- ✅ Default state is "Private"

**Future Integration:**
- When creating new scripts, this setting determines initial visibility
- Scripts can be individually toggled public/private later
- Public scripts accessible at `/user/{userId}/script/{scriptId}`

#### Test Case 5.3: Privacy Settings Persistence
**Steps:**
1. Set profile to Private
2. Set script sharing to Public
3. Reload the page
4. Reopen Settings → Privacy tab

**Expected Results:**
- ✅ Both settings maintained after reload
- ✅ Switches/radio buttons show correct states
- ✅ Settings correctly stored in localStorage

---

### 6. Language Selection Testing

**Location**: General Tab → Language

#### Test Case 6.1: Language Dropdown (Disabled)
**Steps:**
1. Open Settings dialog
2. Navigate to General tab
3. Attempt to click Language dropdown

**Expected Results:**
- ✅ Dropdown is disabled (grayed out)
- ✅ Description says "feature coming soon"
- ✅ Current language shows as "English"
- ✅ Available languages visible in dropdown:
  - English, Español, Français, Deutsch, 日本語, 中文

**Future Integration:**
- When i18n support is added, dropdown will become enabled
- Language selection will trigger UI translation
- All text will be replaced with selected language
- Language preference will persist in localStorage

---

### 7. Project Linking Mode Testing

**Location**: Advanced Tab → Project Linking Mode

#### Test Case 7.1: Shared Project Mode
**Steps:**
1. Open Settings dialog
2. Navigate to Advanced tab
3. Select "Single Shared Project"
4. Close Settings
5. Switch between ScriptScribbler and StoryScribbler tools

**Expected Results:**
- ✅ Same project remains active when switching tools
- ✅ Description explains: "Work on the same project across both tools"
- ✅ Setting persists after page reload

**Integration Points:**
- `src/context/current-script-context.tsx` reads `settings.projectLinkingMode`
- Active project ID shared between both tools

#### Test Case 7.2: Separate Projects Mode
**Steps:**
1. Open Settings dialog
2. Navigate to Advanced tab
3. Select "Separate Projects"
4. Close Settings
5. Switch between ScriptScribbler and StoryScribbler tools

**Expected Results:**
- ✅ Each tool maintains its own active project
- ✅ Description explains: "Maintain different projects for each tool"
- ✅ Setting persists after page reload

**Integration Points:**
- Context maintains separate project IDs for each tool

---

### 8. Advanced Tab Features Testing

**Location**: Advanced Tab

#### Test Case 8.1: AI Model Information
**Steps:**
1. Open Settings dialog
2. Navigate to Advanced tab
3. Read the AI Model section

**Expected Results:**
- ✅ Shows "gemini-2.5-flash" as the configured model
- ✅ Information is read-only (no editing)
- ✅ Styled with muted background for info display

#### Test Case 8.2: Feedback Submission
**Steps:**
1. Open Settings dialog
2. Navigate to Advanced tab
3. Type feedback in the textarea
4. Click "Submit Feedback" button
5. Wait for submission

**Expected Results:**
- ✅ Textarea accepts text input
- ✅ Submit button shows loading state during submission
- ✅ Success toast appears: "Feedback Submitted"
- ✅ Textarea clears after successful submission
- ✅ Feedback stored in Firestore `feedback` collection
- ✅ Settings dialog closes after submission

**Error Cases:**
- ✅ Empty feedback shows error: "Feedback cannot be empty"
- ✅ Not logged in shows error: "You must be logged in to submit feedback"

#### Test Case 8.3: Debug Log Export
**Steps:**
1. Open Settings dialog
2. Navigate to Advanced tab
3. Click "Export" button in Debugging section
4. Wait for export to complete

**Expected Results:**
- ✅ Export button shows loading state
- ✅ Toast appears: "Generating Debug Log..."
- ✅ File downloads with name: `scriptscribbler_debug_{timestamp}.txt`
- ✅ Success toast appears: "Debug Log Exported"
- ✅ File contains:
  - Timestamp and user agent
  - AI Health Diagnosis
  - Raw application state (user, script, contexts)

**File Structure:**
```
============ The Scribbler Debug Log ============
Generated at: {ISO timestamp}

============ AI Health Diagnosis ============
{AI-generated diagnosis}

============ Raw Application State ============
{JSON state data}
```

---

## Settings Persistence Testing

### Global Persistence Test
**Steps:**
1. Configure all settings with non-default values:
   - Theme: Dark
   - Export Format: Fountain
   - Font Size: 20px
   - AI Features: OFF
   - Public Profile: OFF
   - Script Sharing: Public
   - Project Linking: Separate
2. Close the browser completely
3. Reopen the application
4. Check all settings

**Expected Results:**
- ✅ All settings maintained exactly as configured
- ✅ Theme applies before content renders
- ✅ Font size correct in editor
- ✅ AI features remain disabled
- ✅ Privacy settings preserved

### LocalStorage Verification
**Steps:**
1. Open browser DevTools
2. Navigate to Application → Local Storage
3. Find key: `scriptscribbler-settings`
4. Examine the value

**Expected Structure:**
```json
{
  "projectLinkingMode": "shared",
  "theme": "dark",
  "exportFormat": "fountain",
  "editorFontSize": 20,
  "aiFeatureEnabled": false,
  "profilePublic": false,
  "scriptSharingDefault": "public",
  "language": "en"
}
```

---

## Integration Testing

### Settings Context Integration
**Files to verify:**
- `src/context/settings-context.tsx` - Context provider and state management
- `src/context/theme-provider.tsx` - Theme application logic
- `src/components/settings-dialog.tsx` - UI component
- `src/app/layout.tsx` - Provider wrapping

**Verification:**
- ✅ SettingsProvider wraps entire application
- ✅ ThemeProvider nested inside SettingsProvider
- ✅ All child components can access useSettings hook
- ✅ Settings updates trigger re-renders in consuming components

### Component Integration Points

#### Editor Components
- `src/components/script-editor.tsx`:
  - Reads `settings.editorFontSize`
  - Applies font size to editor container
  - Default: 16px
  
- `src/components/script-block.tsx`:
  - Reads `settings.aiFeatureEnabled`
  - Shows/hides AI context menu
  - Default: true

- `src/components/views/editor-view.tsx`:
  - Reads `settings.aiFeatureEnabled`
  - Shows/hides AI FAB
  - Default: true

#### Header Component
- `src/components/layout/app-header.tsx`:
  - Reads `settings.exportFormat`
  - Shows quick export option with default format
  - Triggers correct export handler
  - Default: 'pdf'

---

## Future Expansion Examples

### 1. Privacy Enforcement Implementation

When implementing actual privacy controls, integrate with settings:

```typescript
// Example: Public profile check
const { settings } = useSettings();
const canViewProfile = settings.profilePublic || isOwner;

if (!canViewProfile) {
  return <AccessDenied />;
}
```

```typescript
// Example: New script creation with privacy default
const createNewScript = async () => {
  const { settings } = useSettings();
  
  const newScript = {
    title: 'Untitled Script',
    isPublic: settings.scriptSharingDefault === 'public',
    // ... other fields
  };
  
  await addDoc(scriptsCollection, newScript);
};
```

### 2. Workflow Export Integration

Add workflow-specific export settings:

```typescript
// Example: Extended export settings
interface Settings {
  // ... existing settings
  exportWorkflow?: {
    includePDF: boolean;
    includeFountain: boolean;
    includeMetadata: boolean;
    autoExportOnSave: boolean;
  };
}
```

```typescript
// Example: Workflow export handler
const handleWorkflowExport = async () => {
  const { settings } = useSettings();
  const workflow = settings.exportWorkflow;
  
  if (workflow?.includePDF) {
    await exportPDF();
  }
  if (workflow?.includeFountain) {
    await exportFountain();
  }
  if (workflow?.includeMetadata) {
    await exportMetadata();
  }
};
```

### 3. Additional Settings Examples

```typescript
// Example: Adding new settings to the context
interface Settings {
  // ... existing settings
  
  // Editor preferences
  showLineNumbers?: boolean;
  enableAutoSave?: boolean;
  autoSaveInterval?: number; // seconds
  
  // Accessibility
  highContrastMode?: boolean;
  reducedMotion?: boolean;
  screenReaderMode?: boolean;
  
  // Notifications
  desktopNotifications?: boolean;
  emailNotifications?: boolean;
  notificationSound?: boolean;
}
```

### 4. Internationalization (i18n) Integration

When enabling language support:

```typescript
// Example: i18n integration
import { useTranslation } from 'react-i18next';

const SomeComponent = () => {
  const { settings } = useSettings();
  const { i18n } = useTranslation();
  
  useEffect(() => {
    if (settings.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings.language, i18n]);
  
  return <div>{/* Translated content */}</div>;
};
```

---

## Troubleshooting

### Settings Not Persisting
**Symptom**: Settings reset after page reload

**Checks:**
1. Open DevTools → Console - check for localStorage errors
2. Verify localStorage is not disabled in browser
3. Check if running in private/incognito mode
4. Verify `SETTINGS_STORAGE_KEY = 'scriptscribbler-settings'`

**Solution:**
- Enable localStorage in browser settings
- Use normal browsing mode (not private)
- Check browser console for security errors

### Theme Not Applying
**Symptom**: Theme selection doesn't change appearance

**Checks:**
1. Verify HTML root element has `class="light"` or `class="dark"`
2. Check if Tailwind's dark mode is configured correctly
3. Inspect CSS variables in DevTools

**Solution:**
- Ensure `tailwind.config.ts` has `darkMode: 'class'`
- Verify CSS includes dark mode styles
- Check ThemeProvider is wrapping the app

### Font Size Not Changing
**Symptom**: Editor font size stays the same

**Checks:**
1. Verify `settings.editorFontSize` value in localStorage
2. Check if inline styles are applied to editor
3. Look for conflicting CSS rules

**Solution:**
- Inspect element to see computed styles
- Check if other CSS is overriding the font size
- Verify font size is being read from settings context

### AI Toggle Not Working
**Symptom**: AI features still appear when disabled

**Checks:**
1. Verify `settings.aiFeatureEnabled` is `false`
2. Check if components are reading the setting
3. Look for default values overriding the setting

**Solution:**
- Components should check: `settings.aiFeatureEnabled !== false`
- Default to `true` for backwards compatibility
- Ensure conditional rendering uses the setting

---

## Automated Testing Recommendations

While this application doesn't currently have automated tests, here are recommendations for future implementation:

### Unit Tests
```typescript
// Example: Settings context tests
describe('SettingsContext', () => {
  it('should load settings from localStorage on mount', () => {
    // Test localStorage reading
  });
  
  it('should update localStorage when settings change', () => {
    // Test localStorage writing
  });
  
  it('should provide default values for missing settings', () => {
    // Test default behavior
  });
});
```

### Integration Tests
```typescript
// Example: Theme integration test
describe('Theme Toggle', () => {
  it('should apply theme class to document root', () => {
    // Test theme application
  });
  
  it('should persist theme across page reloads', () => {
    // Test persistence
  });
});
```

### E2E Tests
```typescript
// Example: Cypress/Playwright test
describe('Settings Dialog', () => {
  it('should open settings and change theme', () => {
    cy.visit('/');
    cy.get('[data-testid="user-menu"]').click();
    cy.contains('Settings').click();
    cy.get('[data-testid="theme-dark"]').click();
    cy.get('html').should('have.class', 'dark');
  });
});
```

---

## Summary

This testing guide covers all aspects of the Settings dialog:

✅ **Theme Toggle** - Light/Dark/System modes with persistence
✅ **Export Format** - Default format selection and quick export
✅ **Font Size** - 12-24px slider with real-time updates
✅ **AI Features** - Show/hide AI tools throughout the app
✅ **Privacy Controls** - Profile visibility and script sharing defaults
✅ **Language Selection** - Placeholder for future i18n support
✅ **Project Linking** - Shared or separate projects between tools
✅ **Advanced Features** - AI model info, feedback, debug export

All settings:
- ✅ Update immediately when changed
- ✅ Persist across page reloads via localStorage
- ✅ Trigger application-wide updates
- ✅ Provide sensible defaults
- ✅ Are ready for future feature integration

For questions or issues, please refer to the main documentation or submit feedback through the Settings → Advanced tab.
