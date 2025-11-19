'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSettings } from './settings-context';

type Theme = 'light' | 'dark';

interface ThemeProviderContextType {
  theme: Theme;
}

const ThemeProviderContext = createContext<ThemeProviderContextType>({
  theme: 'light',
});

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  // Determine the actual theme based on settings
  const getEffectiveTheme = (): Theme => {
    const themeMode = settings.theme || 'system';
    
    if (themeMode === 'system') {
      // Check system preference
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    
    return themeMode as Theme;
  };

  const theme = getEffectiveTheme();

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    // Add current theme class
    root.classList.add(theme);
  }, [theme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (settings.theme === 'system' || !settings.theme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        const root = window.document.documentElement;
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [settings.theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
