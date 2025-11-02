'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';

const SETTINGS_STORAGE_KEY = 'scriptscribbler-settings';

export type AiModel = 'gemini-1.5-flash-latest' | 'gemini-1.5-pro-latest';

interface Settings {
  aiModel: AiModel;
}

interface SettingsContextType {
  settings: Settings;
  setAiModel: (model: AiModel) => void;
  isSettingsLoading: boolean;
}

export const SettingsContext = createContext<SettingsContextType>({
  settings: { aiModel: 'gemini-1.5-pro-latest' },
  setAiModel: () => {},
  isSettingsLoading: true,
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>({ aiModel: 'gemini-1.5-pro-latest' });
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

  const setAiModel = useCallback((model: AiModel) => {
    const newSettings = { ...settings, aiModel: model };
    setSettings(newSettings);
    try {
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.warn(`Error saving settings to localStorage:`, error);
    }
  }, [settings]);

  const value = {
    settings,
    setAiModel,
    isSettingsLoading,
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
