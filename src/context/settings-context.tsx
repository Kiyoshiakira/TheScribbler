'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

const SETTINGS_STORAGE_KEY = 'scriptscribbler-settings';

interface Settings {}

interface SettingsContextType {
  settings: Settings;
  isSettingsLoading: boolean;
}

export const SettingsContext = createContext<SettingsContextType>({
  settings: {},
  isSettingsLoading: true,
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

  const value = {
    settings,
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
