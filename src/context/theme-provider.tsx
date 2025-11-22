'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useSettings } from './settings-context';

type Theme = 'light' | 'dark' | 'high-contrast';

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
    
    // High contrast mode takes precedence
    if (themeMode === 'high-contrast') {
      return 'high-contrast';
    }
    
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
    root.classList.remove('light', 'dark', 'high-contrast');
    
    // Add current theme class
    root.classList.add(theme);

    // Apply font size if set
    if (settings.fontSize) {
      root.classList.remove('text-size-sm', 'text-size-base', 'text-size-lg', 'text-size-xl');
      root.classList.add(`text-size-${settings.fontSize}`);
    }

    // Apply line height if set
    if (settings.lineHeight) {
      root.style.setProperty('--line-height', 
        settings.lineHeight === 'tight' ? '1.4' :
        settings.lineHeight === 'normal' ? '1.6' :
        settings.lineHeight === 'relaxed' ? '1.8' : '2.0'
      );
    }
  }, [theme, settings.fontSize, settings.lineHeight]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (settings.theme === 'system' || !settings.theme) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        const root = window.document.documentElement;
        const newTheme = mediaQuery.matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark', 'high-contrast');
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
