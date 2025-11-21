/**
 * @fileoverview Main collaboration provider managing WebSocket connection and sync
 */

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { CollaborativeUser, CollaborativeSession, ConnectionStatus } from './types';
import { PresenceManager } from './PresenceManager';
import { DocumentSyncService } from './DocumentSyncService';
import { ScriptDocument } from '@/lib/editor-types';

export interface CollaborationProviderConfig {
  roomId: string;
  user: CollaborativeUser;
  websocketUrl?: string;
  onConnectionStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
}

export class CollaborationProvider {
  private ydoc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private presenceManager: PresenceManager | null = null;
  private documentSync: DocumentSyncService;
  private config: CollaborationProviderConfig;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private useFallback = false;

  constructor(config: CollaborationProviderConfig) {
    this.config = config;
    this.ydoc = new Y.Doc();
    this.documentSync = new DocumentSyncService(this.ydoc);
  }

  /**
   * Connect to collaborative session
   */
  async connect(): Promise<void> {
    try {
      this.updateStatus(ConnectionStatus.CONNECTING);

      // Determine WebSocket URL
      const wsUrl = this.config.websocketUrl || this.getDefaultWebSocketUrl();

      // Create WebSocket provider
      this.provider = new WebsocketProvider(
        wsUrl,
        this.config.roomId,
        this.ydoc,
        {
          connect: true,
          // Add connection params
          params: {
            userId: this.config.user.id,
            userName: this.config.user.name,
          },
        }
      );

      // Setup connection event handlers
      this.setupProviderEvents();

      // Initialize presence manager
      if (this.provider.awareness) {
        this.presenceManager = new PresenceManager(
          this.provider.awareness,
          this.config.user
        );
      }

      // Wait for initial sync
      await this.waitForSync();
      
      this.updateStatus(ConnectionStatus.CONNECTED);
    } catch (error) {
      console.error('Failed to connect to collaboration session:', error);
      this.updateStatus(ConnectionStatus.ERROR);
      
      // Try fallback to local-only mode
      if (!this.useFallback) {
        this.useFallback = true;
        this.setupFallbackMode();
      }
      
      if (this.config.onError) {
        this.config.onError(error as Error);
      }
    }
  }

  /**
   * Get default WebSocket URL based on environment
   */
  private getDefaultWebSocketUrl(): string {
    // In production, you would configure this to point to your WebSocket server
    // For now, we'll use a public Yjs demo server for testing
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      // Try to connect to a local WebSocket server first
      return `${protocol}//${host}/collab`;
    }
    return 'wss://demos.yjs.dev'; // Fallback to public demo server
  }

  /**
   * Setup WebSocket provider event handlers
   */
  private setupProviderEvents() {
    if (!this.provider) return;

    this.provider.on('status', (event: { status: string }) => {
      switch (event.status) {
        case 'connected':
          this.updateStatus(ConnectionStatus.CONNECTED);
          break;
        case 'connecting':
          this.updateStatus(ConnectionStatus.CONNECTING);
          break;
        case 'disconnected':
          this.updateStatus(ConnectionStatus.DISCONNECTED);
          break;
      }
    });

    this.provider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        this.updateStatus(ConnectionStatus.CONNECTED);
      } else {
        this.updateStatus(ConnectionStatus.SYNCING);
      }
    });
  }

  /**
   * Wait for initial synchronization
   */
  private waitForSync(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.provider) {
        reject(new Error('Provider not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Sync timeout'));
      }, 10000); // 10 second timeout

      const checkSync = () => {
        if (this.provider?.synced) {
          clearTimeout(timeout);
          resolve();
        }
      };

      this.provider.on('sync', checkSync);
      checkSync(); // Check immediately in case already synced
    });
  }

  /**
   * Setup fallback mode for offline/poor connectivity
   */
  private setupFallbackMode() {
    console.warn('Using fallback mode: local-only editing');
    this.updateStatus(ConnectionStatus.DISCONNECTED);
    // Document sync will still work locally
    // Changes will be queued and synced when connection is restored
  }

  /**
   * Update connection status and notify listeners
   */
  private updateStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    if (this.config.onConnectionStatusChange) {
      this.config.onConnectionStatusChange(status);
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get presence manager
   */
  getPresenceManager(): PresenceManager | null {
    return this.presenceManager;
  }

  /**
   * Get document sync service
   */
  getDocumentSync(): DocumentSyncService {
    return this.documentSync;
  }

  /**
   * Initialize document content
   */
  initializeDocument(document: ScriptDocument) {
    this.documentSync.initializeDocument(document);
  }

  /**
   * Disconnect from collaborative session
   */
  disconnect() {
    if (this.provider) {
      this.provider.disconnect();
      this.provider.destroy();
      this.provider = null;
    }

    if (this.presenceManager) {
      this.presenceManager.destroy();
      this.presenceManager = null;
    }

    this.updateStatus(ConnectionStatus.DISCONNECTED);
  }

  /**
   * Cleanup all resources
   */
  destroy() {
    this.disconnect();
    this.documentSync.destroy();
    this.ydoc.destroy();
  }
}
