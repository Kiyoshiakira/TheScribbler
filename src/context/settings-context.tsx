'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

const SETTINGS_STORAGE_KEY = 'scriptscribbler-settings';

export type ProjectLinkingMode = 'shared' | 'separate';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ExportFormat = 'pdf' | 'fountain' | 'finalDraft' | 'plainText' | 'scribbler' | 'googleDocs';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';

interface Settings {
  projectLinkingMode?: ProjectLinkingMode;
  // Theme selection: Light, Dark, or System/Auto
  theme?: ThemeMode;
  // Default export format for scripts
  exportFormat?: ExportFormat;
  // Editor font size in pixels (12-24)
  editorFontSize?: number;
  // Toggle to show/hide AI features in the editor
  aiFeatureEnabled?: boolean;
  // Privacy: make profile public or private
  profilePublic?: boolean;
  // Privacy: default sharing mode for new scripts (public/private)
  scriptSharingDefault?: 'public' | 'private';
  // Language preference for UI (placeholder for future i18n)
  language?: Language;
}

interface SettingsContextType {
  settings: Settings;
  isSettingsLoading: boolean;
  setProjectLinkingMode: (mode: ProjectLinkingMode) => void;
  setTheme: (theme: ThemeMode) => void;
  setExportFormat: (format: ExportFormat) => void;
  setEditorFontSize: (size: number) => void;
  setAiFeatureEnabled: (enabled: boolean) => void;
  setProfilePublic: (isPublic: boolean) => void;
  setScriptSharingDefault: (mode: 'public' | 'private') => void;
  setLanguage: (language: Language) => void;
}

export const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  isSettingsLoading: true,
  setProjectLinkingMode: () => {},
  setTheme: () => {},
  setExportFormat: () => {},
  setEditorFontSize: () => {},
  setAiFeatureEnabled: () => {},
  setProfilePublic: () => {},
  setScriptSharingDefault: () => {},
  setLanguage: () => {},
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>({});
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        setSettings(JSON.parse(storedSettings));
      }
    } catch (error) {
      console.warn(`Error reading settings from localStorage:`, error);
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  // Helper function to update settings in both state and localStorage
  const updateSettings = (newSettings: Settings) => {
    try {
      setSettings(newSettings);
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.warn(`Error saving settings to localStorage:`, error);
    }
  };

  const setProjectLinkingMode = (mode: ProjectLinkingMode) => {
    updateSettings({ ...settings, projectLinkingMode: mode });
  };

  // Theme selection: Controls light/dark/system theme
  const setTheme = (theme: ThemeMode) => {
    updateSettings({ ...settings, theme });
  };

  // Export format: Default format for script exports
  const setExportFormat = (format: ExportFormat) => {
    updateSettings({ ...settings, exportFormat: format });
  };

  // Editor font size: Controls text size in the editor (12-24px)
  const setEditorFontSize = (size: number) => {
    updateSettings({ ...settings, editorFontSize: size });
  };

  // AI features toggle: Show/hide AI-powered tools in the editor
  const setAiFeatureEnabled = (enabled: boolean) => {
    updateSettings({ ...settings, aiFeatureEnabled: enabled });
  };

  // Privacy: Controls whether user profile is public or private
  const setProfilePublic = (isPublic: boolean) => {
    updateSettings({ ...settings, profilePublic: isPublic });
  };

  // Privacy: Default sharing mode for new scripts
  const setScriptSharingDefault = (mode: 'public' | 'private') => {
    updateSettings({ ...settings, scriptSharingDefault: mode });
  };

  // Language: UI language preference (for future i18n support)
  const setLanguage = (language: Language) => {
    updateSettings({ ...settings, language });
  };

  const value = {
    settings,
    isSettingsLoading,
    setProjectLinkingMode,
    setTheme,
    setExportFormat,
    setEditorFontSize,
    setAiFeatureEnabled,
    setProfilePublic,
    setScriptSharingDefault,
    setLanguage,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
