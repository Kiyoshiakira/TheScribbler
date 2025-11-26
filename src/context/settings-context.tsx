'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

const SETTINGS_STORAGE_KEY = 'scriptscribbler-settings';

export type ProjectLinkingMode = 'shared' | 'separate';
export type ThemeMode = 'light' | 'dark' | 'system' | 'high-contrast';
export type ExportFormat = 'pdf' | 'fountain' | 'finalDraft' | 'plainText' | 'scribbler' | 'googleDocs';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
export type AiProviderType = 'google-ai' | 'openai' | 'local';
export type FontSize = 'sm' | 'base' | 'lg' | 'xl';
export type LineHeight = 'tight' | 'normal' | 'relaxed' | 'loose';

interface Settings {
  projectLinkingMode?: ProjectLinkingMode;
  // Theme selection: Light, Dark, System/Auto, or High Contrast
  theme?: ThemeMode;
  // Default export format for scripts
  exportFormat?: ExportFormat;
  // Editor font size in pixels (12-24)
  editorFontSize?: number;
  // Global UI font size
  fontSize?: FontSize;
  // Global line height
  lineHeight?: LineHeight;
  // Toggle to show/hide AI features in the editor
  aiFeatureEnabled?: boolean;
  // Privacy: make profile public or private
  profilePublic?: boolean;
  // Privacy: default sharing mode for new scripts (public/private)
  scriptSharingDefault?: 'public' | 'private';
  // Language preference for UI (placeholder for future i18n)
  language?: Language;
  // AI provider selection
  aiProvider?: AiProviderType;
  // AI usage limit per session
  aiUsageLimit?: number;
}

interface SettingsContextType {
  settings: Settings;
  isSettingsLoading: boolean;
  setProjectLinkingMode: (mode: ProjectLinkingMode) => void;
  setTheme: (theme: ThemeMode) => void;
  setExportFormat: (format: ExportFormat) => void;
  setEditorFontSize: (size: number) => void;
  setFontSize: (size: FontSize) => void;
  setLineHeight: (height: LineHeight) => void;
  setAiFeatureEnabled: (enabled: boolean) => void;
  setProfilePublic: (isPublic: boolean) => void;
  setScriptSharingDefault: (mode: 'public' | 'private') => void;
  setLanguage: (language: Language) => void;
  setAiProvider: (provider: AiProviderType) => void;
  setAiUsageLimit: (limit: number) => void;
}

export const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  isSettingsLoading: true,
  setProjectLinkingMode: () => {},
  setTheme: () => {},
  setExportFormat: () => {},
  setEditorFontSize: () => {},
  setFontSize: () => {},
  setLineHeight: () => {},
  setAiFeatureEnabled: () => {},
  setProfilePublic: () => {},
  setScriptSharingDefault: () => {},
  setLanguage: () => {},
  setAiProvider: () => {},
  setAiUsageLimit: () => {},
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

  // AI provider: Select which AI provider to use
  const setAiProvider = (provider: AiProviderType) => {
    updateSettings({ ...settings, aiProvider: provider });
  };

  // AI usage limit: Set usage limit per session
  const setAiUsageLimit = (limit: number) => {
    updateSettings({ ...settings, aiUsageLimit: limit });
  };

  // Font size: Set global UI font size
  const setFontSize = (size: FontSize) => {
    updateSettings({ ...settings, fontSize: size });
  };

  // Line height: Set global line height
  const setLineHeight = (height: LineHeight) => {
    updateSettings({ ...settings, lineHeight: height });
  };

  const value = {
    settings,
    isSettingsLoading,
    setProjectLinkingMode,
    setTheme,
    setExportFormat,
    setEditorFontSize,
    setFontSize,
    setLineHeight,
    setAiFeatureEnabled,
    setProfilePublic,
    setScriptSharingDefault,
    setLanguage,
    setAiProvider,
    setAiUsageLimit,
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
