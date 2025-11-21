/**
 * @fileoverview Collaborative editor component with real-time presence
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useUser } from '@/firebase';
import {
  CollaborationProvider,
  CollaborativeUser,
  ConnectionStatus,
  UserPresence,
} from '@/services/collab';
import { ScriptDocument } from '@/lib/editor-types';
import { getUserColor, getUserInitials } from '@/services/collab/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, RefreshCw, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CollaborativeEditorProps {
  roomId: string;
  initialDocument: ScriptDocument;
  onDocumentChange: (doc: ScriptDocument) => void;
  children: React.ReactNode;
  websocketUrl?: string;
}

export default function CollaborativeEditor({
  roomId,
  initialDocument,
  onDocumentChange,
  children,
  websocketUrl,
}: CollaborativeEditorProps) {
  const { user } = useUser();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [activeUsers, setActiveUsers] = useState<Map<number, UserPresence>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  const providerRef = useRef<CollaborationProvider | null>(null);

  // Initialize collaboration provider
  useEffect(() => {
    if (!user || !roomId || isInitialized) return;

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

    // Setup document sync
    const documentSync = collaborationProvider.getDocumentSync();
    const unsubscribeDoc = documentSync.onUpdate(onDocumentChange);

    // Connect to session
    collaborationProvider.connect().then(() => {
      // Setup presence tracking
      const presenceManager = collaborationProvider.getPresenceManager();
      if (presenceManager) {
        const unsubscribePresence = presenceManager.onPresenceUpdate(setActiveUsers);
        
        // Register cleanup with provider
        collaborationProvider.registerCleanup(unsubscribePresence);
      }
    });

    providerRef.current = collaborationProvider;
    setIsInitialized(true);

    // Cleanup
    return () => {
      unsubscribeDoc();
      collaborationProvider.destroy();
      providerRef.current = null;
    };
  }, [user, roomId, websocketUrl, initialDocument, onDocumentChange, isInitialized]);

  // Connection status indicator
  const renderConnectionStatus = () => {
    const statusConfig = {
      [ConnectionStatus.CONNECTED]: {
        icon: Wifi,
        label: 'Connected',
        className: 'text-green-600 dark:text-green-400',
      },
      [ConnectionStatus.CONNECTING]: {
        icon: RefreshCw,
        label: 'Connecting...',
        className: 'text-yellow-600 dark:text-yellow-400 animate-spin',
      },
      [ConnectionStatus.SYNCING]: {
        icon: RefreshCw,
        label: 'Syncing...',
        className: 'text-blue-600 dark:text-blue-400 animate-spin',
      },
      [ConnectionStatus.DISCONNECTED]: {
        icon: WifiOff,
        label: 'Offline',
        className: 'text-gray-600 dark:text-gray-400',
      },
      [ConnectionStatus.ERROR]: {
        icon: WifiOff,
        label: 'Connection Error',
        className: 'text-red-600 dark:text-red-400',
      },
    };

    const config = statusConfig[connectionStatus];
    const Icon = config.icon;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="gap-1.5">
              <Icon className={cn('h-3 w-3', config.className)} />
              <span className="text-xs">{config.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {connectionStatus === ConnectionStatus.CONNECTED
                ? 'Real-time collaboration active'
                : connectionStatus === ConnectionStatus.DISCONNECTED
                ? 'Working offline - changes will sync when connected'
                : config.label}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Active collaborators display
  const renderActiveUsers = () => {
    const users = Array.from(activeUsers.values());
    
    if (users.length === 0) return null;

    return (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex -space-x-2">
          {users.slice(0, 5).map((presence, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar
                    className="h-8 w-8 border-2 border-background"
                    style={{ borderColor: presence.user.color }}
                  >
                    <AvatarImage src={presence.user.avatar} alt={presence.user.name} />
                    <AvatarFallback style={{ backgroundColor: presence.user.color + '20' }}>
                      <span style={{ color: presence.user.color }}>
                        {getUserInitials(presence.user.name)}
                      </span>
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs font-medium">{presence.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {presence.user.email || 'Active now'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {users.length > 5 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
              +{users.length - 5}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Collaboration header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          {renderConnectionStatus()}
          {renderActiveUsers()}
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
