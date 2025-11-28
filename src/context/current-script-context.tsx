'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useSettings } from './settings-context';
import { useTool } from './tool-context';

const SCRIPT_STORAGE_KEY = 'scriptscribbler-current-script-id';
const STORY_STORAGE_KEY = 'storyscribbler-current-script-id';

interface CurrentScriptContextType {
  currentScriptId: string | null;
  setCurrentScriptId: (id: string | null) => void;
  isCurrentScriptLoading: boolean;
  // Per-tool project IDs for separate mode
  scriptScribblerScriptId: string | null;
  setScriptScribblerScriptId: (id: string | null) => void;
  storyScribblerScriptId: string | null;
  setStoryScribblerScriptId: (id: string | null) => void;
}

export const CurrentScriptContext = createContext<CurrentScriptContextType>({
  currentScriptId: null,
  setCurrentScriptId: () => {},
  isCurrentScriptLoading: true,
  // Per-tool project IDs for separate mode
  scriptScribblerScriptId: null,
  setScriptScribblerScriptId: () => {},
  storyScribblerScriptId: null,
  setStoryScribblerScriptId: () => {},
});

export const CurrentScriptProvider = ({ children }: { children: ReactNode }) => {
  const [scriptScribblerScriptId, setScriptScribblerScriptId] = useState<string | null>(null);
  const [storyScribblerScriptId, setStoryScribblerScriptId] = useState<string | null>(null);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { settings, isSettingsLoading } = useSettings();
  const { currentTool } = useTool();

  // Get the appropriate storage key and state based on the current mode
  const projectLinkingMode = settings.projectLinkingMode || 'shared';
  const isSharedMode = projectLinkingMode === 'shared';
  
  // In shared mode, always use scriptScribblerScriptId
  // In separate mode, use the appropriate ID based on current tool
  const currentScriptId = isSharedMode 
    ? scriptScribblerScriptId 
    : (currentTool === 'ScriptScribbler' ? scriptScribblerScriptId : storyScribblerScriptId);

  // 1. Load from localStorage on initial mount
  useEffect(() => {
    try {
      const scriptId = window.localStorage.getItem(SCRIPT_STORAGE_KEY);
      const storyId = window.localStorage.getItem(STORY_STORAGE_KEY);
      
      if (scriptId) {
        setScriptScribblerScriptId(scriptId);
      }
      if (storyId) {
        setStoryScribblerScriptId(storyId);
      }
    } catch (error) {
      console.warn(`[CurrentScriptContext] Error reading localStorage:`, error);
    } finally {
      setIsLoadedFromStorage(true);
    }
  }, []);

  const scriptsCollection = useMemoFirebase(
    () => (user && firestore ? collection(firestore, 'users', user.uid, 'scripts') : null),
    [user, firestore]
  );

  const latestScriptQuery = useMemoFirebase(
      () => (scriptsCollection ? query(scriptsCollection, orderBy('lastModified', 'desc'), limit(1)) : null),
      [scriptsCollection]
  );
  
  const { data: latestScripts, isLoading: areScriptsLoading } = useCollection<{id: string}>(latestScriptQuery);

  // 2. If no script is set, default to the most recent one from Firestore
  useEffect(() => {
    if (isLoadedFromStorage && !isUserLoading && !areScriptsLoading && !isSettingsLoading) {
      // In shared mode, only set scriptScribblerScriptId if it's not set
      if (isSharedMode && !scriptScribblerScriptId) {
        if (latestScripts && latestScripts.length > 0) {
          setScriptScribblerScriptId(latestScripts[0].id);
        } else {
          setScriptScribblerScriptId(null);
        }
      }
      // In separate mode, set both if they're not set
      else if (!isSharedMode) {
        if (!scriptScribblerScriptId) {
          if (latestScripts && latestScripts.length > 0) {
            setScriptScribblerScriptId(latestScripts[0].id);
          } else {
            setScriptScribblerScriptId(null);
          }
        }
        if (!storyScribblerScriptId) {
          if (latestScripts && latestScripts.length > 0) {
            setStoryScribblerScriptId(latestScripts[0].id);
          } else {
            setStoryScribblerScriptId(null);
          }
        }
      }
    }
  }, [isLoadedFromStorage, scriptScribblerScriptId, storyScribblerScriptId, isUserLoading, areScriptsLoading, latestScripts, isSharedMode, isSettingsLoading]);

  // Helper function to sync a project ID to localStorage
  const syncToLocalStorage = useCallback((key: string, id: string | null) => {
    if (id) {
      window.localStorage.setItem(key, id);
    } else {
      window.localStorage.removeItem(key);
    }
  }, []);

  const setCurrentScriptId = useCallback((id: string | null) => {
    try {
      if (isSharedMode) {
        // In shared mode, update both scriptScribblerScriptId and storyScribblerScriptId
        syncToLocalStorage(SCRIPT_STORAGE_KEY, id);
        setScriptScribblerScriptId(id);
        syncToLocalStorage(STORY_STORAGE_KEY, id);
        setStoryScribblerScriptId(id);
      } else {
        // In separate mode, update the appropriate ID based on current tool
        if (currentTool === 'ScriptScribbler') {
          syncToLocalStorage(SCRIPT_STORAGE_KEY, id);
          setScriptScribblerScriptId(id);
        } else {
          syncToLocalStorage(STORY_STORAGE_KEY, id);
          setStoryScribblerScriptId(id);
        }
      }
    } catch (error) {
      console.warn(`[CurrentScriptContext] Error setting localStorage:`, error);
    }
  }, [isSharedMode, currentTool, syncToLocalStorage]);

  // Direct setter for scriptScribblerScriptId with localStorage sync
  const handleSetScriptScribblerScriptId = useCallback((id: string | null) => {
    try {
      syncToLocalStorage(SCRIPT_STORAGE_KEY, id);
      setScriptScribblerScriptId(id);
      // In shared mode, also update storyScribblerScriptId
      if (isSharedMode) {
        syncToLocalStorage(STORY_STORAGE_KEY, id);
        setStoryScribblerScriptId(id);
      }
    } catch (error) {
      console.warn(`[CurrentScriptContext] Error setting scriptScribblerScriptId:`, error);
    }
  }, [isSharedMode, syncToLocalStorage]);

  // Direct setter for storyScribblerScriptId with localStorage sync
  const handleSetStoryScribblerScriptId = useCallback((id: string | null) => {
    try {
      syncToLocalStorage(STORY_STORAGE_KEY, id);
      setStoryScribblerScriptId(id);
      // In shared mode, also update scriptScribblerScriptId
      if (isSharedMode) {
        syncToLocalStorage(SCRIPT_STORAGE_KEY, id);
        setScriptScribblerScriptId(id);
      }
    } catch (error) {
      console.warn(`[CurrentScriptContext] Error setting storyScribblerScriptId:`, error);
    }
  }, [isSharedMode, syncToLocalStorage]);
  
  const isCurrentScriptLoading = !isLoadedFromStorage || isUserLoading || areScriptsLoading || isSettingsLoading;
  
  const value = { 
      currentScriptId,
      setCurrentScriptId,
      isCurrentScriptLoading,
      // Per-tool project IDs for separate mode
      scriptScribblerScriptId,
      setScriptScribblerScriptId: handleSetScriptScribblerScriptId,
      storyScribblerScriptId,
      setStoryScribblerScriptId: handleSetStoryScribblerScriptId,
  };

  return (
    <CurrentScriptContext.Provider value={value}>
      {children}
    </CurrentScriptContext.Provider>
  );
};

export const useCurrentScript = () => {
    const context = useContext(CurrentScriptContext);
    if (!context) {
        throw new Error('useCurrentScript must be used within a CurrentScriptProvider');
    }
    return context;
}
