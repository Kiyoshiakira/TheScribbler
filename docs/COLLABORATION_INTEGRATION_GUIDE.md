# Integration Guide: Adding Collaborative Editing to Your Editor

This guide shows how to integrate real-time collaborative editing into TheScribbler's existing editor components.

## Quick Integration

### Step 1: Wrap Your Editor Component

The easiest way to add collaboration is to wrap your existing editor with the `CollaborativeEditor` component:

```tsx
import CollaborativeEditor from '@/components/Editor/CollaborativeEditor';
import { useScript } from '@/context/script-context';

function MyEditorView() {
  const { document, setBlocks } = useScript();
  const roomId = 'my-unique-room-id'; // Generate from script ID or session

  return (
    <CollaborativeEditor
      roomId={roomId}
      initialDocument={document}
      onDocumentChange={(newDoc) => setBlocks(newDoc.blocks)}
    >
      {/* Your existing editor components */}
      <ScriptEditor />
    </CollaborativeEditor>
  );
}
```

### Step 2: Generate Room IDs

For persistent collaboration, generate room IDs based on the script/document ID:

```tsx
import { useCurrentScript } from '@/context/current-script-context';

function MyEditorView() {
  const { currentScriptId } = useCurrentScript();
  const roomId = `script-${currentScriptId}`;
  
  // ... rest of component
}
```

For temporary sessions, use the `generateRoomId()` utility:

```tsx
import { generateRoomId } from '@/services/collab/utils';

const [sessionId] = useState(() => generateRoomId());
```

## Advanced Integration with useCollaboration Hook

For more control over the collaboration features, use the `useCollaboration` hook directly:

```tsx
import { useCollaboration } from '@/hooks/use-collaboration';
import { useScript } from '@/context/script-context';
import { useEffect, useCallback } from 'react';

function MyAdvancedEditor() {
  const { document, setBlocks } = useScript();
  const roomId = 'my-room-id';

  const {
    documentSync,
    connectionStatus,
    activeUsers,
    updateBlock,
    insertBlock,
    deleteBlock,
  } = useCollaboration({
    roomId,
    initialDocument: document,
    enabled: true,
  });

  // Subscribe to remote changes
  useEffect(() => {
    if (!documentSync) return;

    const unsubscribe = documentSync.onUpdate((newDoc) => {
      setBlocks(newDoc.blocks);
    });

    return unsubscribe;
  }, [documentSync, setBlocks]);

  // Handle local edits
  const handleBlockEdit = useCallback((blockId: string, newText: string) => {
    // Update locally (optimistic update)
    const newBlocks = document.blocks.map(block =>
      block.id === blockId ? { ...block, text: newText } : block
    );
    setBlocks(newBlocks);

    // Sync with collaborators
    updateBlock(blockId, { text: newText });
  }, [document, setBlocks, updateBlock]);

  return (
    <div>
      <div>Status: {connectionStatus}</div>
      <div>Active users: {activeUsers.size}</div>
      {/* Your editor UI */}
    </div>
  );
}
```

## Integrating with ScriptEditor

Here's how to integrate collaboration into the existing ScriptEditor component:

### Option 1: Wrapper Component (Recommended)

Create a new `CollaborativeScriptEditor` component:

```tsx
// src/components/CollaborativeScriptEditor.tsx
'use client';

import { useScript } from '@/context/script-context';
import { useCurrentScript } from '@/context/current-script-context';
import CollaborativeEditor from '@/components/Editor/CollaborativeEditor';
import ScriptEditor from '@/components/script-editor';

export default function CollaborativeScriptEditor() {
  const { document, setBlocks } = useScript();
  const { currentScriptId } = useCurrentScript();
  
  const roomId = currentScriptId ? `script-${currentScriptId}` : null;

  if (!roomId) {
    // No script selected, show regular editor
    return <ScriptEditor />;
  }

  return (
    <CollaborativeEditor
      roomId={roomId}
      initialDocument={document}
      onDocumentChange={(newDoc) => setBlocks(newDoc.blocks)}
    >
      <ScriptEditor />
    </CollaborativeEditor>
  );
}
```

Then use it in your editor view:

```tsx
// src/components/views/editor-view.tsx
import CollaborativeScriptEditor from '@/components/CollaborativeScriptEditor';

function EditorViewContent() {
  return (
    <div>
      {/* Other UI elements */}
      <CollaborativeScriptEditor />
    </div>
  );
}
```

### Option 2: Direct Integration

Modify the existing ScriptEditor to optionally enable collaboration:

```tsx
// src/components/script-editor.tsx
interface ScriptEditorProps {
  isStandalone?: boolean;
  onEditScene?: (sceneNumber: number) => void;
  enableCollaboration?: boolean; // New prop
}

export default function ScriptEditor({ 
  isStandalone = false, 
  onEditScene,
  enableCollaboration = false 
}: ScriptEditorProps) {
  const { document, setBlocks } = useScript();
  const { currentScriptId } = useCurrentScript();

  const {
    documentSync,
    updateBlock,
  } = useCollaboration({
    roomId: currentScriptId ? `script-${currentScriptId}` : '',
    initialDocument: document,
    enabled: enableCollaboration && !!currentScriptId,
  });

  // Subscribe to remote changes when collaboration is enabled
  useEffect(() => {
    if (!enableCollaboration || !documentSync) return;

    const unsubscribe = documentSync.onUpdate((newDoc) => {
      setBlocks(newDoc.blocks);
    });

    return unsubscribe;
  }, [enableCollaboration, documentSync, setBlocks]);

  const handleBlockChange = (blockId: string, newText: string) => {
    const newBlocks = document.blocks.map(block =>
      block.id === blockId ? { ...block, text: newText } : block
    );
    setBlocks(newBlocks);

    // Sync with collaborators if enabled
    if (enableCollaboration && updateBlock) {
      updateBlock(blockId, { text: newText });
    }
  };

  // ... rest of component
}
```

## Adding Cursor Tracking

To show where other users are editing:

```tsx
import { useCollaboration } from '@/hooks/use-collaboration';
import { getUserColor } from '@/services/collab/utils';

function MyEditor() {
  const { activeUsers, updateCursor } = useCollaboration({
    // ... config
  });

  const handleCursorMove = (blockId: string, offset: number) => {
    updateCursor(blockId, offset);
  };

  return (
    <div>
      {Array.from(activeUsers.values()).map((presence) => (
        <div
          key={presence.user.id}
          className="cursor-indicator"
          style={{
            borderColor: presence.user.color,
          }}
        >
          {presence.user.name}
        </div>
      ))}
      {/* Editor content */}
    </div>
  );
}
```

## Session Management with Firebase

To persist collaborative sessions:

```tsx
import { useFirestore, useUser } from '@/firebase';
import { SessionPersistenceService } from '@/services/collab';
import { useState, useEffect } from 'react';

function MyComponent() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [sessionService, setSessionService] = useState<SessionPersistenceService | null>(null);

  useEffect(() => {
    if (firestore && user) {
      setSessionService(new SessionPersistenceService(firestore, user.uid));
    }
  }, [firestore, user]);

  const handleStartSession = async (documentId: string, roomId: string) => {
    if (!sessionService) return;

    await sessionService.createSession(
      'session-' + Date.now(),
      documentId,
      'persistent',
      roomId
    );
  };

  const handleSaveSnapshot = async (sessionId: string, document: ScriptDocument) => {
    if (!sessionService) return;

    await sessionService.saveDocumentSnapshot(
      sessionId,
      JSON.stringify(document)
    );
  };

  // ... rest of component
}
```

## Settings Integration

Add a collaboration toggle to user settings:

```tsx
// In settings-context.tsx
interface Settings {
  // ... existing settings
  collaborationEnabled?: boolean;
}

// In settings dialog
<div>
  <Label>Enable Real-time Collaboration</Label>
  <Switch
    checked={settings.collaborationEnabled ?? true}
    onCheckedChange={(checked) => 
      updateSettings({ collaborationEnabled: checked })
    }
  />
  <p className="text-sm text-muted-foreground">
    Allow multiple users to edit documents simultaneously
  </p>
</div>
```

Then use the setting in your editor:

```tsx
const { settings } = useSettings();

<CollaborativeScriptEditor 
  enabled={settings.collaborationEnabled ?? true}
/>
```

## Testing Collaboration

### Local Testing with Multiple Browser Windows

1. Start the app: `npm run dev`
2. Open two browser windows
3. Navigate to the same document in both
4. Edit in one window and see changes in the other

### Testing with Different Users

1. Open one window in normal mode
2. Open another in incognito/private mode
3. Sign in with different accounts
4. Navigate to the same document
5. Test editing and presence features

### Testing Offline Behavior

1. Start editing a document
2. Disconnect from network (or stop the WebSocket server)
3. Continue editing (should work offline)
4. Reconnect to network
5. Verify changes sync

## Performance Considerations

### Debouncing Updates

For large documents, debounce update notifications:

```tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedUpdate = useDebouncedCallback(
  (blockId: string, text: string) => {
    updateBlock(blockId, { text });
  },
  300 // 300ms delay
);
```

### Limiting Active Collaborators

Display a warning for too many collaborators:

```tsx
const MAX_COLLABORATORS = 10;

{activeUsers.size >= MAX_COLLABORATORS && (
  <Alert>
    Too many active collaborators. Performance may be degraded.
  </Alert>
)}
```

### Cleanup on Unmount

Always clean up when component unmounts:

```tsx
useEffect(() => {
  // Setup collaboration
  
  return () => {
    // Cleanup is automatic with the hook
    // But you can add additional cleanup here
  };
}, []);
```

## Troubleshooting

### Changes not syncing
- Check WebSocket connection status
- Verify roomId is the same for all users
- Check browser console for errors
- Ensure WebSocket server is running

### Presence not showing
- Check if PresenceManager is initialized
- Verify awareness is enabled
- Check for errors in presence updates

### Performance issues
- Reduce update frequency with debouncing
- Limit number of active collaborators
- Optimize document size
- Consider pagination for large documents

## Next Steps

1. Deploy a WebSocket server (see WEBSOCKET_SERVER_SETUP.md)
2. Configure production WebSocket URL
3. Add cursor tracking visualization
4. Implement commenting system
5. Add version history integration
6. Create collaboration analytics

## Resources

- [Yjs Documentation](https://docs.yjs.dev)
- [y-websocket GitHub](https://github.com/yjs/y-websocket)
- [CRDT Explained](https://crdt.tech/)
- Main Implementation: COLLABORATION_README.md
