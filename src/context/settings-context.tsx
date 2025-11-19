'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

const SETTINGS_STORAGE_KEY = 'scriptscribbler-settings';

export type ProjectLinkingMode = 'shared' | 'separate';

interface Settings {
  projectLinkingMode?: ProjectLinkingMode;
}

interface SettingsContextType {
  settings: Settings;
  isSettingsLoading: boolean;
  setProjectLinkingMode: (mode: ProjectLinkingMode) => void;
}

export const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  isSettingsLoading: true,
  setProjectLinkingMode: () => {},
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

  const setProjectLinkingMode = (mode: ProjectLinkingMode) => {
    try {
      const newSettings = { ...settings, projectLinkingMode: mode };
      setSettings(newSettings);
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.warn(`Error saving settings to localStorage:`, error);
    }
  };

  const value = {
    settings,
    isSettingsLoading,
    setProjectLinkingMode,
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
