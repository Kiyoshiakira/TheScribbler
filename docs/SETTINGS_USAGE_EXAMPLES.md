# Settings Usage Examples

## Overview

This document provides code examples and patterns for developers working with The Scribbler's Settings system. It demonstrates how to integrate settings into components and extend the system with new settings.

## Quick Reference

### Accessing Settings in a Component

```typescript
import { useSettings } from '@/context/settings-context';

function MyComponent() {
  const { settings } = useSettings();
  
  // Access individual settings
  const theme = settings.theme;
  const fontSize = settings.editorFontSize || 16;
  const aiEnabled = settings.aiFeatureEnabled !== false;
  
  return (
    <div style={{ fontSize: `${fontSize}px` }}>
      Current theme: {theme}
    </div>
  );
}
```

### Updating Settings

```typescript
import { useSettings } from '@/context/settings-context';

function SettingsControl() {
  const { settings, setTheme, setEditorFontSize } = useSettings();
  
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
  };
  
  const increaseFontSize = () => {
    const currentSize = settings.editorFontSize || 16;
    setEditorFontSize(Math.min(currentSize + 2, 24));
  };
  
  return (
    <div>
      <button onClick={() => handleThemeChange('dark')}>Dark Mode</button>
      <button onClick={increaseFontSize}>Increase Font Size</button>
    </div>
  );
}
```

---

## Available Settings

### Settings Interface

```typescript
interface Settings {
  // Project management
  projectLinkingMode?: 'shared' | 'separate';
  
  // Theme and appearance
  theme?: 'light' | 'dark' | 'system';
  
  // Export preferences
  exportFormat?: 'pdf' | 'fountain' | 'finalDraft' | 'plainText' | 'scribbler' | 'googleDocs';
  
  // Editor preferences
  editorFontSize?: number; // 12-24 pixels
  
  // Feature toggles
  aiFeatureEnabled?: boolean;
  
  // Privacy settings
  profilePublic?: boolean;
  scriptSharingDefault?: 'public' | 'private';
  
  // Localization
  language?: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
}
```

### Context Functions

```typescript
interface SettingsContextType {
  settings: Settings;
  isSettingsLoading: boolean;
  
  // Setters for each setting
  setProjectLinkingMode: (mode: ProjectLinkingMode) => void;
  setTheme: (theme: ThemeMode) => void;
  setExportFormat: (format: ExportFormat) => void;
  setEditorFontSize: (size: number) => void;
  setAiFeatureEnabled: (enabled: boolean) => void;
  setProfilePublic: (isPublic: boolean) => void;
  setScriptSharingDefault: (mode: 'public' | 'private') => void;
  setLanguage: (language: Language) => void;
}
```

---

## Common Use Cases

### 1. Conditional Rendering Based on Settings

#### Example: Show/Hide AI Features

```typescript
import { useSettings } from '@/context/settings-context';

function EditorToolbar() {
  const { settings } = useSettings();
  const aiEnabled = settings.aiFeatureEnabled !== false; // Default to true
  
  return (
    <div className="toolbar">
      <button>Format</button>
      <button>Insert</button>
      
      {/* Only show AI button if enabled */}
      {aiEnabled && (
        <button>AI Assist</button>
      )}
    </div>
  );
}
```

#### Example: Conditional Feature Access

```typescript
import { useSettings } from '@/context/settings-context';

function ScriptBlock({ block }: { block: Block }) {
  const { settings } = useSettings();
  const [showAiMenu, setShowAiMenu] = useState(false);
  
  const handleTextSelection = () => {
    // Only show AI context menu if AI features are enabled
    if (settings.aiFeatureEnabled !== false) {
      setShowAiMenu(true);
    }
  };
  
  return (
    <div onMouseUp={handleTextSelection}>
      {block.text}
      {showAiMenu && <AiContextMenu />}
    </div>
  );
}
```

### 2. Applying Style Settings

#### Example: Dynamic Font Size

```typescript
import { useSettings } from '@/context/settings-context';

function ScriptEditor() {
  const { settings } = useSettings();
  const fontSize = settings.editorFontSize || 16; // Default to 16px
  
  return (
    <div 
      className="editor-container"
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Editor content */}
    </div>
  );
}
```

#### Example: Theme-Aware Component

```typescript
import { useSettings } from '@/context/settings-context';
import { useTheme } from '@/context/theme-provider';

function CustomComponent() {
  const { theme } = useTheme(); // Current effective theme (light/dark)
  const { settings } = useSettings();
  
  const bgColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
  const textColor = theme === 'dark' ? '#ffffff' : '#000000';
  
  return (
    <div style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Theme-aware content */}
    </div>
  );
}
```

### 3. Export Format Integration

#### Example: Quick Export Button

```typescript
import { useSettings } from '@/context/settings-context';

function ExportButton() {
  const { settings } = useSettings();
  
  const getExportLabel = () => {
    switch (settings.exportFormat) {
      case 'fountain': return 'Export as Fountain';
      case 'finalDraft': return 'Export as Final Draft';
      case 'plainText': return 'Export as Plain Text';
      case 'scribbler': return 'Export as Scribbler';
      case 'googleDocs': return 'Export to Google Docs';
      default: return 'Export as PDF';
    }
  };
  
  const handleQuickExport = async () => {
    const format = settings.exportFormat || 'pdf';
    
    switch (format) {
      case 'pdf':
        await exportPDF();
        break;
      case 'fountain':
        await exportFountain();
        break;
      case 'finalDraft':
        await exportFinalDraft();
        break;
      case 'plainText':
        await exportPlainText();
        break;
      case 'scribbler':
        await exportScribbler();
        break;
      case 'googleDocs':
        await exportToGoogleDocs();
        break;
    }
  };
  
  return (
    <button onClick={handleQuickExport}>
      {getExportLabel()}
    </button>
  );
}
```

### 4. Privacy Settings Integration

#### Example: Check Profile Visibility

```typescript
import { useSettings } from '@/context/settings-context';
import { useUser } from '@/firebase';

function ProfilePage({ userId }: { userId: string }) {
  const { user } = useUser();
  const { settings } = useSettings();
  
  const isOwner = user?.uid === userId;
  const isPublic = settings.profilePublic !== false; // Default to public
  
  if (!isOwner && !isPublic) {
    return <AccessDenied message="This profile is private" />;
  }
  
  return <ProfileContent userId={userId} />;
}
```

#### Example: Apply Default Script Visibility

```typescript
import { useSettings } from '@/context/settings-context';
import { addDoc, collection } from 'firebase/firestore';

function CreateScriptButton() {
  const { settings } = useSettings();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const createNewScript = async () => {
    if (!user || !firestore) return;
    
    const scriptsRef = collection(firestore, 'users', user.uid, 'scripts');
    
    // Use privacy default from settings
    const isPublic = settings.scriptSharingDefault === 'public';
    
    await addDoc(scriptsRef, {
      title: 'Untitled Script',
      content: '',
      isPublic, // Apply default from settings
      createdAt: serverTimestamp(),
    });
  };
  
  return <button onClick={createNewScript}>New Script</button>;
}
```

### 5. Project Linking Mode

#### Example: Switch Between Tools

```typescript
import { useSettings } from '@/context/settings-context';
import { useCurrentScript } from '@/context/current-script-context';

function ToolSwitcher() {
  const { settings } = useSettings();
  const { currentScriptId, setCurrentScriptId } = useCurrentScript();
  const [currentTool, setCurrentTool] = useState<'script' | 'story'>('script');
  
  const switchToStoryScribbler = () => {
    if (settings.projectLinkingMode === 'shared') {
      // Keep the same project active
      setCurrentTool('story');
    } else {
      // Load separate project for StoryScribbler
      const storyProjectId = localStorage.getItem('story-scribbler-project-id');
      setCurrentScriptId(storyProjectId || null);
      setCurrentTool('story');
    }
  };
  
  return (
    <button onClick={switchToStoryScribbler}>
      Switch to StoryScribbler
    </button>
  );
}
```

---

## Advanced Patterns

### 1. Settings-Aware Hook

Create a custom hook that combines settings with other logic:

```typescript
import { useSettings } from '@/context/settings-context';

function useEditorPreferences() {
  const { settings } = useSettings();
  
  return {
    fontSize: settings.editorFontSize || 16,
    aiEnabled: settings.aiFeatureEnabled !== false,
    theme: settings.theme || 'system',
    
    // Derived values
    isLargeFont: (settings.editorFontSize || 16) > 20,
    isSmallFont: (settings.editorFontSize || 16) < 14,
    isDarkMode: settings.theme === 'dark',
  };
}

// Usage
function MyEditor() {
  const prefs = useEditorPreferences();
  
  return (
    <div style={{ fontSize: `${prefs.fontSize}px` }}>
      {prefs.aiEnabled && <AiAssistant />}
    </div>
  );
}
```

### 2. Settings Synchronization

Sync settings with Firestore for cross-device support:

```typescript
import { useSettings } from '@/context/settings-context';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

function useSettingsSync() {
  const { settings, setTheme, setEditorFontSize, /* ... */ } = useSettings();
  const { user } = useUser();
  const firestore = useFirestore();
  
  // Save settings to Firestore when they change
  useEffect(() => {
    if (!user || !firestore) return;
    
    const userDocRef = doc(firestore, 'users', user.uid);
    setDoc(userDocRef, { settings }, { merge: true });
  }, [settings, user, firestore]);
  
  // Listen for settings changes from other devices
  useEffect(() => {
    if (!user || !firestore) return;
    
    const userDocRef = doc(firestore, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      const data = doc.data();
      if (data?.settings) {
        // Update local settings with server values
        const serverSettings = data.settings;
        if (serverSettings.theme) setTheme(serverSettings.theme);
        if (serverSettings.editorFontSize) setEditorFontSize(serverSettings.editorFontSize);
        // ... update other settings
      }
    });
    
    return unsubscribe;
  }, [user, firestore]);
}
```

### 3. Settings Migration

Handle settings version updates:

```typescript
import { useSettings } from '@/context/settings-context';

const SETTINGS_VERSION = 2;

function migrateSettings(oldSettings: any): Settings {
  const version = oldSettings._version || 1;
  
  if (version < 2) {
    // Migrate from v1 to v2
    return {
      ...oldSettings,
      // Add new default values
      profilePublic: oldSettings.profilePublic ?? true,
      scriptSharingDefault: oldSettings.scriptSharingDefault ?? 'private',
      _version: 2,
    };
  }
  
  return oldSettings;
}

// Use in SettingsProvider initialization
useEffect(() => {
  const stored = localStorage.getItem('scriptscribbler-settings');
  if (stored) {
    const parsed = JSON.parse(stored);
    const migrated = migrateSettings(parsed);
    setSettings(migrated);
  }
}, []);
```

### 4. Settings Presets

Create and apply settings presets:

```typescript
interface SettingsPreset {
  name: string;
  description: string;
  settings: Partial<Settings>;
}

const PRESETS: SettingsPreset[] = [
  {
    name: 'Writer Mode',
    description: 'Focus on writing with minimal distractions',
    settings: {
      theme: 'dark',
      editorFontSize: 18,
      aiFeatureEnabled: false,
    },
  },
  {
    name: 'AI-Assisted',
    description: 'Full AI features for enhanced writing',
    settings: {
      theme: 'light',
      editorFontSize: 16,
      aiFeatureEnabled: true,
    },
  },
  {
    name: 'Large Text',
    description: 'Comfortable reading with larger fonts',
    settings: {
      editorFontSize: 24,
      theme: 'light',
    },
  },
];

function SettingsPresets() {
  const { 
    setTheme, 
    setEditorFontSize, 
    setAiFeatureEnabled 
  } = useSettings();
  
  const applyPreset = (preset: SettingsPreset) => {
    if (preset.settings.theme) setTheme(preset.settings.theme);
    if (preset.settings.editorFontSize) setEditorFontSize(preset.settings.editorFontSize);
    if (preset.settings.aiFeatureEnabled !== undefined) {
      setAiFeatureEnabled(preset.settings.aiFeatureEnabled);
    }
  };
  
  return (
    <div>
      {PRESETS.map((preset) => (
        <button key={preset.name} onClick={() => applyPreset(preset)}>
          <div>{preset.name}</div>
          <div>{preset.description}</div>
        </button>
      ))}
    </div>
  );
}
```

---

## Extending the Settings System

### Adding a New Setting

To add a new setting to the system, follow these steps:

#### Step 1: Update the Settings Interface

```typescript
// src/context/settings-context.tsx

interface Settings {
  // ... existing settings
  
  // Add your new setting
  autoSave?: boolean;
  autoSaveInterval?: number; // in seconds
}
```

#### Step 2: Add Setter Function to Context

```typescript
// src/context/settings-context.tsx

interface SettingsContextType {
  // ... existing functions
  
  setAutoSave: (enabled: boolean) => void;
  setAutoSaveInterval: (interval: number) => void;
}

export const SettingsContext = createContext<SettingsContextType>({
  // ... existing defaults
  
  setAutoSave: () => {},
  setAutoSaveInterval: () => {},
});
```

#### Step 3: Implement Setter in Provider

```typescript
// src/context/settings-context.tsx

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  // ... existing code
  
  const setAutoSave = (enabled: boolean) => {
    updateSettings({ ...settings, autoSave: enabled });
  };
  
  const setAutoSaveInterval = (interval: number) => {
    updateSettings({ ...settings, autoSaveInterval: interval });
  };
  
  const value = {
    // ... existing values
    setAutoSave,
    setAutoSaveInterval,
  };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
```

#### Step 4: Add UI Controls

```typescript
// src/components/settings-dialog.tsx

<TabsContent value="editor">
  {/* ... existing controls */}
  
  <Separator />
  
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div>
        <Label htmlFor="auto-save">Auto Save</Label>
        <p className="text-sm text-muted-foreground">
          Automatically save your work
        </p>
      </div>
      <Switch
        id="auto-save"
        checked={settings.autoSave !== false}
        onCheckedChange={setAutoSave}
      />
    </div>
    
    {settings.autoSave !== false && (
      <div className="space-y-2">
        <Label>Auto Save Interval (seconds)</Label>
        <Slider
          value={[settings.autoSaveInterval || 30]}
          onValueChange={([value]) => setAutoSaveInterval(value)}
          min={10}
          max={300}
          step={10}
        />
        <p className="text-sm text-muted-foreground">
          Current: {settings.autoSaveInterval || 30} seconds
        </p>
      </div>
    )}
  </div>
</TabsContent>
```

#### Step 5: Use the New Setting

```typescript
// In any component
import { useSettings } from '@/context/settings-context';

function MyEditor() {
  const { settings } = useSettings();
  const { script, updateScript } = useScript();
  
  useEffect(() => {
    if (!settings.autoSave) return;
    
    const interval = settings.autoSaveInterval || 30;
    const timer = setInterval(() => {
      updateScript(script);
    }, interval * 1000);
    
    return () => clearInterval(timer);
  }, [settings.autoSave, settings.autoSaveInterval, script, updateScript]);
  
  return <div>Editor with auto-save</div>;
}
```

---

## Best Practices

### 1. Always Provide Defaults

```typescript
// ✅ Good: Provide default value
const fontSize = settings.editorFontSize || 16;

// ❌ Bad: No default, could be undefined
const fontSize = settings.editorFontSize;
```

### 2. Use Boolean Checks Carefully

```typescript
// ✅ Good: Handle undefined as enabled (backwards compatible)
const aiEnabled = settings.aiFeatureEnabled !== false;

// ❌ Bad: Undefined becomes disabled
const aiEnabled = settings.aiFeatureEnabled === true;

// ✅ Good: Explicit default
const aiEnabled = settings.aiFeatureEnabled ?? true;
```

### 3. Check Settings Loading State

```typescript
function MyComponent() {
  const { settings, isSettingsLoading } = useSettings();
  
  if (isSettingsLoading) {
    return <LoadingSpinner />;
  }
  
  // Now safe to use settings
  return <div style={{ fontSize: `${settings.editorFontSize || 16}px` }}>
    Content
  </div>;
}
```

### 4. Memoize Settings-Dependent Values

```typescript
import { useMemo } from 'react';

function EditorComponent() {
  const { settings } = useSettings();
  
  // ✅ Good: Memoize expensive calculations
  const editorStyles = useMemo(() => ({
    fontSize: `${settings.editorFontSize || 16}px`,
    lineHeight: `${(settings.editorFontSize || 16) * 1.5}px`,
    // ... other style calculations
  }), [settings.editorFontSize]);
  
  return <div style={editorStyles}>Content</div>;
}
```

### 5. Document Setting Purposes

```typescript
interface Settings {
  /**
   * Controls the text size in the script editor.
   * @range 12-24 pixels
   * @default 16
   */
  editorFontSize?: number;
  
  /**
   * Toggles AI-powered features throughout the application.
   * When disabled, hides AI context menus and assistants.
   * @default true (for backwards compatibility)
   */
  aiFeatureEnabled?: boolean;
}
```

---

## Testing Examples

### Unit Test: Settings Context

```typescript
import { renderHook, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from '@/context/settings-context';

describe('SettingsContext', () => {
  it('should provide default settings', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });
    
    expect(result.current.settings).toBeDefined();
    expect(result.current.isSettingsLoading).toBe(false);
  });
  
  it('should update theme setting', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });
    
    act(() => {
      result.current.setTheme('dark');
    });
    
    expect(result.current.settings.theme).toBe('dark');
  });
  
  it('should persist settings to localStorage', () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: SettingsProvider,
    });
    
    act(() => {
      result.current.setEditorFontSize(20);
    });
    
    const stored = JSON.parse(
      localStorage.getItem('scriptscribbler-settings') || '{}'
    );
    expect(stored.editorFontSize).toBe(20);
  });
});
```

### Integration Test: Settings and Components

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsProvider } from '@/context/settings-context';
import { ThemeProvider } from '@/context/theme-provider';
import SettingsDialog from '@/components/settings-dialog';

describe('SettingsDialog Integration', () => {
  it('should apply theme when changed', async () => {
    render(
      <SettingsProvider>
        <ThemeProvider>
          <SettingsDialog open={true} onOpenChange={() => {}} />
        </ThemeProvider>
      </SettingsProvider>
    );
    
    const darkThemeRadio = screen.getByLabelText('Dark');
    await userEvent.click(darkThemeRadio);
    
    expect(document.documentElement).toHaveClass('dark');
  });
});
```

---

## Troubleshooting

### Common Issues

#### Issue: Settings not persisting

```typescript
// Check localStorage availability
if (typeof window !== 'undefined' && window.localStorage) {
  // Safe to use localStorage
}

// Check for quota exceeded errors
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
} catch (e) {
  console.error('localStorage not available:', e);
}
```

#### Issue: Theme flashing on page load

```typescript
// Solution: Apply theme before React hydration
// Add to <head> tag in layout.tsx

<script dangerouslySetInnerHTML={{
  __html: `
    (function() {
      const settings = JSON.parse(
        localStorage.getItem('scriptscribbler-settings') || '{}'
      );
      const theme = settings.theme || 'system';
      const effectiveTheme = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;
      document.documentElement.classList.add(effectiveTheme);
    })();
  `
}} />
```

---

## Summary

The Settings system provides a flexible, persistent way to customize The Scribbler experience:

- **Easy to use**: Single `useSettings()` hook
- **Type-safe**: Full TypeScript support
- **Persistent**: Automatic localStorage sync
- **Extensible**: Simple to add new settings
- **Application-wide**: Updates propagate to all components
- **Well-documented**: Clear patterns and examples

For additional information, see:
- [SETTINGS_TESTING_GUIDE.md](./SETTINGS_TESTING_GUIDE.md) - Comprehensive testing procedures
- [SETTINGS_IMPLEMENTATION.md](../SETTINGS_IMPLEMENTATION.md) - Implementation details
- [README.md](../README.md) - Application overview

---

**Questions or suggestions?** Submit feedback through Settings → Advanced → Provide Feedback!
