/**
 * @fileoverview Type definitions for collaborative editing
 */

import { ScriptBlock } from '@/lib/editor-types';

/**
 * Represents a user in a collaborative session
 */
export interface CollaborativeUser {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  color: string; // Hex color for cursor/selection highlight
}

/**
 * User presence information including cursor position
 */
export interface UserPresence {
  user: CollaborativeUser;
  cursor?: {
    blockId: string;
    offset: number;
  };
  selection?: {
    anchor: {
      blockId: string;
      offset: number;
    };
    focus: {
      blockId: string;
      offset: number;
    };
  };
  lastActivity: number; // timestamp
}

/**
 * Connection status for collaborative session
 */
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  SYNCING = 'syncing',
  ERROR = 'error',
}

/**
 * Collaborative session metadata
 */
export interface CollaborativeSession {
  id: string;
  documentId: string;
  type: 'persistent' | 'live';
  createdBy: string;
  createdAt: number;
  lastModified: number;
  participants: string[]; // user IDs
  isActive: boolean;
}

/**
 * Document operation for CRDT sync
 */
export interface DocumentOperation {
  type: 'insert' | 'delete' | 'update';
  blockId?: string;
  position?: number;
  content?: Partial<ScriptBlock>;
  timestamp: number;
  userId: string;
}

/**
 * Conflict resolution strategy
 */
export enum ConflictResolution {
  LAST_WRITE_WINS = 'last-write-wins',
  CRDT_MERGE = 'crdt-merge',
  MANUAL = 'manual',
}
