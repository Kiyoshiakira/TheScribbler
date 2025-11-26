/**
 * useAutosave Hook
 * 
 * Provides autosave functionality with configurable debounce.
 * Saves to IndexedDB automatically and tracks save status.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { saveManager, Draft } from '@/utils/saveManager';

export interface UseAutosaveOptions {
  /**
   * Unique identifier for the draft
   */
  id: string;
  
  /**
   * Content to autosave
   */
  content: string;
  
  /**
   * Debounce delay in milliseconds (default: 2000ms)
   */
  debounceMs?: number;
  
  /**
   * Whether autosave is enabled (default: true)
   */
  enabled?: boolean;
  
  /**
   * Callback when save succeeds
   */
  onSaveSuccess?: () => void;
  
  /**
   * Callback when save fails
   */
  onSaveError?: (error: Error) => void;
  
  /**
   * Additional metadata to save with the draft
   */
  metadata?: Draft['metadata'];
}

export interface UseAutosaveReturn {
  /**
   * Whether a save is currently in progress
   */
  isSaving: boolean;
  
  /**
   * Timestamp of last successful save
   */
  lastSaved: number | null;
  
  /**
   * Manually trigger a save
   */
  saveNow: () => Promise<void>;
  
  /**
   * Whether the browser is online
   */
  isOnline: boolean;
  
  /**
   * Last error that occurred during save
   */
  lastError: Error | null;
}

export function useAutosave({
  id,
  content,
  debounceMs = 2000,
  enabled = true,
  onSaveSuccess,
  onSaveError,
  metadata,
}: UseAutosaveOptions): UseAutosaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(saveManager.isOnline());
  const [lastError, setLastError] = useState<Error | null>(null);
  
  // Debounce the content to reduce save frequency
  const [debouncedContent] = useDebounce(content, debounceMs);
  
  // Track initial content to avoid saving on mount
  const initialContentRef = useRef(content);
  const hasChangedRef = useRef(false);

  // Update hasChanged flag when content changes
  useEffect(() => {
    if (content !== initialContentRef.current) {
      hasChangedRef.current = true;
    }
  }, [content]);

  // Save function
  const saveNow = useCallback(async () => {
    if (!enabled || !id) {
      return;
    }

    setIsSaving(true);
    setLastError(null);

    try {
      await saveManager.saveDraft(id, content, metadata);
      setLastSaved(Date.now());
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error('Failed to save draft');
      setLastError(saveError);
      if (onSaveError) {
        onSaveError(saveError);
      }
    } finally {
      setIsSaving(false);
    }
  }, [id, content, enabled, metadata, onSaveSuccess, onSaveError]);

  // Autosave when debounced content changes
  useEffect(() => {
    // Don't save on initial mount
    if (!hasChangedRef.current) {
      return;
    }

    if (enabled && id && debouncedContent !== undefined) {
      saveNow();
    }
  }, [debouncedContent, enabled, id, saveNow]);

  // Listen for online/offline status changes
  useEffect(() => {
    const unsubscribe = saveManager.addStatusListener(() => {
      setIsOnline(saveManager.isOnline());
    });

    return unsubscribe;
  }, []);

  // Save on blur (when user leaves the editor)
  useEffect(() => {
    if (!enabled || !id) {
      return;
    }

    const handleBlur = () => {
      // Only save if content has changed
      if (hasChangedRef.current) {
        saveNow();
      }
    };

    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, id, saveNow]);

  // Save before unload
  useEffect(() => {
    if (!enabled || !id) {
      return;
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChangedRef.current && !isSaving) {
        // Show browser warning if there are unsaved changes
        // Note: The browser may or may not show this message
        e.preventDefault();
        e.returnValue = '';
        
        // Save to sessionStorage as a backup before page unload
        // We use sessionStorage instead of IndexedDB because async operations
        // may not complete before the page unloads
        try {
          const draft = {
            id,
            content,
            timestamp: Date.now(),
            synced: saveManager.isOnline(),
            metadata,
          };
          
          // Store in sessionStorage for synchronous save
          sessionStorage.setItem(`draft-backup-${id}`, JSON.stringify(draft));
        } catch (error) {
          console.error('[useAutosave] Error saving before unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, id, content, metadata, isSaving]);

  return {
    isSaving,
    lastSaved,
    saveNow,
    isOnline,
    lastError,
  };
}
