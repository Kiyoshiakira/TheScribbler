/**
 * Save Manager
 * 
 * Handles local-first persistence with IndexedDB for offline editing.
 * Provides autosave functionality with online/offline detection and sync queue.
 */

import { get, set, del, entries, createStore } from 'idb-keyval';

// Custom store for drafts
const draftStore = createStore('TheScribbler-Drafts', 'drafts');

export interface Draft {
  id: string;
  content: string;
  timestamp: number;
  synced: boolean;
  metadata?: {
    title?: string;
    type?: string;
    [key: string]: unknown;
  };
}

export interface SaveManagerOptions {
  onOnline?: () => void;
  onOffline?: () => void;
}

class SaveManager {
  private online: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private syncQueue: Set<string> = new Set();
  private listeners: (() => void)[] = [];

  constructor(options?: SaveManagerOptions) {
    if (typeof window !== 'undefined') {
      // Set initial online status
      this.online = navigator.onLine;

      // Listen for online/offline events
      window.addEventListener('online', () => {
        this.online = true;
        if (options?.onOnline) {
          options.onOnline();
        }
        this.notifyListeners();
        // Notify about unsynced drafts when coming online
        this.notifyUnsyncedDrafts();
      });

      window.addEventListener('offline', () => {
        this.online = false;
        if (options?.onOffline) {
          options.onOffline();
        }
        this.notifyListeners();
      });
    }
  }

  /**
   * Check if the browser is currently online
   */
  isOnline(): boolean {
    return this.online;
  }

  /**
   * Add a listener for online/offline status changes
   */
  addStatusListener(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * Save a draft to IndexedDB
   */
  async saveDraft(id: string, content: string, metadata?: Draft['metadata']): Promise<void> {
    const draft: Draft = {
      id,
      content,
      timestamp: Date.now(),
      synced: this.online,
      metadata,
    };

    try {
      await set(id, draft, draftStore);
      
      // Add to sync queue if offline
      if (!this.online) {
        this.syncQueue.add(id);
      }
    } catch (error) {
      console.error('[SaveManager] Error saving draft:', error);
      throw error;
    }
  }

  /**
   * Get a draft from IndexedDB
   */
  async getDraft(id: string): Promise<Draft | undefined> {
    try {
      return await get<Draft>(id, draftStore);
    } catch (error) {
      console.error('[SaveManager] Error getting draft:', error);
      return undefined;
    }
  }

  /**
   * Delete a draft from IndexedDB
   */
  async deleteDraft(id: string): Promise<void> {
    try {
      await del(id, draftStore);
      this.syncQueue.delete(id);
    } catch (error) {
      console.error('[SaveManager] Error deleting draft:', error);
      throw error;
    }
  }

  /**
   * Get all drafts from IndexedDB
   */
  async getAllDrafts(): Promise<Draft[]> {
    try {
      const allEntries = await entries<string, Draft>(draftStore);
      return allEntries.map(([, draft]) => draft);
    } catch (error) {
      console.error('[SaveManager] Error getting all drafts:', error);
      return [];
    }
  }

  /**
   * Get all unsynced drafts
   */
  async getUnsyncedDrafts(): Promise<Draft[]> {
    try {
      const drafts = await this.getAllDrafts();
      return drafts.filter(draft => !draft.synced);
    } catch (error) {
      console.error('[SaveManager] Error getting unsynced drafts:', error);
      return [];
    }
  }

  /**
   * Mark a draft as synced
   */
  async markAsSynced(id: string): Promise<void> {
    try {
      const draft = await this.getDraft(id);
      if (draft) {
        draft.synced = true;
        await set(id, draft, draftStore);
        this.syncQueue.delete(id);
      }
    } catch (error) {
      console.error('[SaveManager] Error marking draft as synced:', error);
      throw error;
    }
  }

  /**
   * Notify about pending drafts (to be called when coming online)
   * Consumers should implement actual sync logic based on their needs
   */
  private async notifyUnsyncedDrafts(): Promise<void> {
    const unsyncedDrafts = await this.getUnsyncedDrafts();
    
    if (unsyncedDrafts.length > 0) {
      console.log('[SaveManager] Found unsynced drafts:', unsyncedDrafts.length);
      // Emit event or call callback for consumers to handle sync
      this.notifyListeners();
    }
  }

  /**
   * Check if there are any unsynced drafts
   */
  async hasUnsyncedDrafts(): Promise<boolean> {
    const unsynced = await this.getUnsyncedDrafts();
    return unsynced.length > 0;
  }

  /**
   * Clear all drafts (use with caution)
   */
  async clearAllDrafts(): Promise<void> {
    try {
      const allDrafts = await this.getAllDrafts();
      await Promise.all(allDrafts.map(draft => this.deleteDraft(draft.id)));
      this.syncQueue.clear();
    } catch (error) {
      console.error('[SaveManager] Error clearing all drafts:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const saveManager = new SaveManager();

export default SaveManager;
