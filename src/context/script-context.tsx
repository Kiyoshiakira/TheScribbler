'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';

const initialScript = `FADE IN:

INT. COFFEE SHOP - DAY

Sunlight streams through the large windows of a bustling, modern coffee shop. The air is thick with the smell of roasted beans and chatter.

JANE (28), sharp and dressed in a business suit, types furiously on her laptop. A half-empty mug sits beside her.

Across the room, LEO (30), clad in a worn-out band t-shirt and jeans, sketches in a notebook, seemingly lost in his own world.

A sudden CRASH from the counter makes everyone jump. A barista has dropped a tray of cups.

In the ensuing silence, Jane and Leo's eyes meet for the first time. A spark.

BARISTA
(Flustered)
Sorry, everyone! Clean-up on aisle three!

The moment is broken. Jane returns to her screen, a faint smile on her lips. Leo goes back to his sketch, but his drawing has now changed. It's a quick, rough portrait of Jane.

FADE OUT.
`;

const SCRIPT_STORAGE_KEY = 'scriptsync-content';

interface ScriptContextType {
  scriptContent: string;
  setScriptContent: (content: string) => void;
}

export const ScriptContext = createContext<ScriptContextType>({
  scriptContent: initialScript,
  setScriptContent: () => {},
});

export const ScriptProvider = ({ children }: { children: ReactNode }) => {
  const [scriptContent, setScriptContent] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on initial mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(SCRIPT_STORAGE_KEY);
      setScriptContent(item ? item : initialScript);
    } catch (error) {
      console.warn(`Error reading localStorage key “${SCRIPT_STORAGE_KEY}”:`, error);
      setScriptContent(initialScript);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isLoaded) {
      try {
        window.localStorage.setItem(SCRIPT_STORAGE_KEY, scriptContent);
      } catch (error) {
        console.warn(`Error setting localStorage key “${SCRIPT_STORAGE_KEY}”:`, error);
      }
    }
  }, [scriptContent, isLoaded]);
  
  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SCRIPT_STORAGE_KEY && e.newValue !== scriptContent) {
        setScriptContent(e.newValue || initialScript);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [scriptContent]);

  const value = { scriptContent, setScriptContent };

  return (
    <ScriptContext.Provider value={value}>
      {children}
    </ScriptContext.Provider>
  );
};

export const useScript = () => {
    const context = useContext(ScriptContext);
    if (!context) {
        throw new Error('useScript must be used within a ScriptProvider');
    }
    return context;
}
