/**
 * @fileoverview Manages user presence and awareness in collaborative sessions
 */

import { Awareness } from 'y-protocols/awareness';
import { CollaborativeUser, UserPresence } from './types';
import { getUserColor, isRecentActivity } from './utils';

export class PresenceManager {
  private awareness: Awareness;
  private currentUser: CollaborativeUser;
  private presenceUpdateCallbacks: ((presence: Map<number, UserPresence>) => void)[] = [];
  private cleanupInterval?: NodeJS.Timeout;

  constructor(awareness: Awareness, user: CollaborativeUser) {
    this.awareness = awareness;
    this.currentUser = {
      ...user,
      color: user.color || getUserColor(user.id),
    };

    this.setupPresenceTracking();
    this.startCleanup();
  }

  /**
   * Setup tracking for presence changes
   */
  private setupPresenceTracking() {
    // Set initial presence
    this.awareness.setLocalStateField('user', this.currentUser);
    this.awareness.setLocalStateField('lastActivity', Date.now());

    // Listen for changes
    this.awareness.on('change', this.handleAwarenessChange.bind(this));
  }

  /**
   * Handle awareness state changes
   */
  private handleAwarenessChange() {
    const presence = this.getActivePresence();
    this.presenceUpdateCallbacks.forEach(callback => callback(presence));
  }

  /**
   * Get all active user presence information
   */
  getActivePresence(): Map<number, UserPresence> {
    const presence = new Map<number, UserPresence>();
    const states = this.awareness.getStates();

    states.forEach((state, clientId) => {
      // Skip our own presence
      if (clientId === this.awareness.clientID) {
        return;
      }

      if (state.user && isRecentActivity(state.lastActivity || 0)) {
        presence.set(clientId, {
          user: state.user,
          cursor: state.cursor,
          selection: state.selection,
          lastActivity: state.lastActivity,
        });
      }
    });

    return presence;
  }

  /**
   * Update current user's cursor position
   */
  updateCursor(blockId: string, offset: number) {
    this.awareness.setLocalStateField('cursor', { blockId, offset });
    this.awareness.setLocalStateField('lastActivity', Date.now());
  }

  /**
   * Update current user's selection
   */
  updateSelection(
    anchorBlockId: string,
    anchorOffset: number,
    focusBlockId: string,
    focusOffset: number
  ) {
    this.awareness.setLocalStateField('selection', {
      anchor: { blockId: anchorBlockId, offset: anchorOffset },
      focus: { blockId: focusBlockId, offset: focusOffset },
    });
    this.awareness.setLocalStateField('lastActivity', Date.now());
  }

  /**
   * Clear current user's selection
   */
  clearSelection() {
    this.awareness.setLocalStateField('selection', undefined);
    this.awareness.setLocalStateField('lastActivity', Date.now());
  }

  /**
   * Subscribe to presence updates
   */
  onPresenceUpdate(callback: (presence: Map<number, UserPresence>) => void) {
    this.presenceUpdateCallbacks.push(callback);
    // Immediately call with current state
    callback(this.getActivePresence());

    // Return unsubscribe function
    return () => {
      const index = this.presenceUpdateCallbacks.indexOf(callback);
      if (index > -1) {
        this.presenceUpdateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Update user information
   */
  updateUser(updates: Partial<CollaborativeUser>) {
    this.currentUser = { ...this.currentUser, ...updates };
    this.awareness.setLocalStateField('user', this.currentUser);
    this.awareness.setLocalStateField('lastActivity', Date.now());
  }

  /**
   * Start cleanup interval for stale presence
   */
  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.awareness.setLocalStateField('lastActivity', Date.now());
    }, 10000); // Update activity every 10 seconds
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.presenceUpdateCallbacks = [];
    this.awareness.destroy();
  }
}
