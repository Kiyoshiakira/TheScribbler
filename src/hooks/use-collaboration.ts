/**
 * @fileoverview React hook for managing collaborative editing
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useUser } from '@/firebase';
import {
  CollaborationProvider,
  CollaborativeUser,
  ConnectionStatus,
  UserPresence,
  DocumentSyncService,
  PresenceManager,
} from '@/services/collab';
import { ScriptDocument, ScriptBlock } from '@/lib/editor-types';
import { getUserColor } from '@/services/collab/utils';

export interface UseCollaborationOptions {
  roomId: string;
  initialDocument: ScriptDocument;
  websocketUrl?: string;
  enabled?: boolean;
}

export interface UseCollaborationReturn {
  provider: CollaborationProvider | null;
  documentSync: DocumentSyncService | null;
  presenceManager: PresenceManager | null;
  connectionStatus: ConnectionStatus;
  activeUsers: Map<number, UserPresence>;
  isConnected: boolean;
  updateBlock: (blockId: string, updates: Partial<ScriptBlock>) => void;
  insertBlock: (index: number, block: ScriptBlock) => void;
  deleteBlock: (blockId: string) => void;
  updateCursor: (blockId: string, offset: number) => void;
  updateSelection: (
    anchorBlockId: string,
    anchorOffset: number,
    focusBlockId: string,
    focusOffset: number
  ) => void;
  clearSelection: () => void;
}

export function useCollaboration({
  roomId,
  initialDocument,
  websocketUrl,
  enabled = true,
}: UseCollaborationOptions): UseCollaborationReturn {
  const { user } = useUser();
  const [provider, setProvider] = useState<CollaborationProvider | null>(null);
  const [documentSync, setDocumentSync] = useState<DocumentSyncService | null>(null);
  const [presenceManager, setPresenceManager] = useState<PresenceManager | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [activeUsers, setActiveUsers] = useState<Map<number, UserPresence>>(new Map());
  const initRef = useRef(false);

  // Initialize collaboration
  useEffect(() => {
    if (!enabled || !user || !roomId || initRef.current) return;

    const currentUser: CollaborativeUser = {
      id: user.uid,
      name: user.displayName || user.email || 'Anonymous',
      email: user.email || undefined,
      avatar: user.photoURL || undefined,
      color: getUserColor(user.uid),
    };

    const collaborationProvider = new CollaborationProvider({
      roomId,
      user: currentUser,
      websocketUrl,
      onConnectionStatusChange: setConnectionStatus,
      onError: (error) => {
        console.error('Collaboration error:', error);
      },
    });

    // Initialize document
    collaborationProvider.initializeDocument(initialDocument);

    // Get services
    const docSync = collaborationProvider.getDocumentSync();
    setDocumentSync(docSync);

    // Connect to session
    collaborationProvider.connect().then(() => {
      const presenceMgr = collaborationProvider.getPresenceManager();
      if (presenceMgr) {
        setPresenceManager(presenceMgr);
        presenceMgr.onPresenceUpdate(setActiveUsers);
      }
    });

    setProvider(collaborationProvider);
    initRef.current = true;

    // Cleanup
    return () => {
      collaborationProvider.destroy();
      setProvider(null);
      setDocumentSync(null);
      setPresenceManager(null);
      initRef.current = false;
    };
  }, [enabled, user, roomId, websocketUrl, initialDocument]);

  // Document operations
  const updateBlock = useCallback(
    (blockId: string, updates: Partial<ScriptBlock>) => {
      if (documentSync) {
        documentSync.updateBlock(blockId, updates);
      }
    },
    [documentSync]
  );

  const insertBlock = useCallback(
    (index: number, block: ScriptBlock) => {
      if (documentSync) {
        documentSync.insertBlock(index, block);
      }
    },
    [documentSync]
  );

  const deleteBlock = useCallback(
    (blockId: string) => {
      if (documentSync) {
        documentSync.deleteBlock(blockId);
      }
    },
    [documentSync]
  );

  // Presence operations
  const updateCursor = useCallback(
    (blockId: string, offset: number) => {
      if (presenceManager) {
        presenceManager.updateCursor(blockId, offset);
      }
    },
    [presenceManager]
  );

  const updateSelection = useCallback(
    (
      anchorBlockId: string,
      anchorOffset: number,
      focusBlockId: string,
      focusOffset: number
    ) => {
      if (presenceManager) {
        presenceManager.updateSelection(
          anchorBlockId,
          anchorOffset,
          focusBlockId,
          focusOffset
        );
      }
    },
    [presenceManager]
  );

  const clearSelection = useCallback(() => {
    if (presenceManager) {
      presenceManager.clearSelection();
    }
  }, [presenceManager]);

  const isConnected = connectionStatus === ConnectionStatus.CONNECTED;

  return {
    provider,
    documentSync,
    presenceManager,
    connectionStatus,
    activeUsers,
    isConnected,
    updateBlock,
    insertBlock,
    deleteBlock,
    updateCursor,
    updateSelection,
    clearSelection,
  };
}
