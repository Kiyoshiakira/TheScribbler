# Real-time Collaborative Editing

This document describes the real-time collaborative editing implementation for TheScribbler.

## Overview

TheScribbler now supports real-time collaborative editing, allowing multiple users to work on the same document simultaneously with:

- **Real-time synchronization** using Yjs CRDT (Conflict-free Replicated Data Type)
- **Presence indicators** showing active collaborators
- **Connection status** with offline fallback support
- **Session persistence** using Firebase Firestore
- **Conflict-free merging** via CRDT automatic resolution

## Architecture

### Components

1. **CollaborationProvider** (`src/services/collab/CollaborationProvider.ts`)
   - Manages WebSocket connection to collaboration server
   - Handles document synchronization via Yjs
   - Provides fallback for offline scenarios

2. **PresenceManager** (`src/services/collab/PresenceManager.ts`)
   - Tracks active users and their cursor positions
   - Manages user awareness information
   - Provides real-time presence updates

3. **DocumentSyncService** (`src/services/collab/DocumentSyncService.ts`)
   - Manages document state using Yjs CRDT
   - Handles block-level operations (insert, update, delete)
   - Synchronizes changes across clients

4. **SessionPersistenceService** (`src/services/collab/SessionPersistenceService.ts`)
   - Persists collaborative sessions to Firebase
   - Manages session metadata and participants
   - Stores document snapshots for recovery

### UI Components

1. **CollaborativeEditor** (`src/components/Editor/CollaborativeEditor.tsx`)
   - Wrapper component for adding collaboration to any editor
   - Displays connection status and active users
   - Shows presence indicators

2. **useCollaboration Hook** (`src/hooks/use-collaboration.ts`)
   - React hook for managing collaborative editing
   - Provides document and presence operations
   - Handles connection lifecycle

## Usage

### Basic Integration

```tsx
import CollaborativeEditor from '@/components/Editor/CollaborativeEditor';
import { ScriptDocument } from '@/lib/editor-types';

function MyEditor() {
  const [document, setDocument] = useState<ScriptDocument>(initialDoc);

  return (
    <CollaborativeEditor
      roomId="unique-session-id"
      initialDocument={document}
      onDocumentChange={setDocument}
      websocketUrl="wss://your-server.com/collab" // Optional
    >
      {/* Your editor UI */}
    </CollaborativeEditor>
  );
}
```

### Advanced Usage with Hook

```tsx
import { useCollaboration } from '@/hooks/use-collaboration';

function MyAdvancedEditor() {
  const {
    documentSync,
    connectionStatus,
    activeUsers,
    updateBlock,
    updateCursor,
  } = useCollaboration({
    roomId: 'session-123',
    initialDocument: myDocument,
    enabled: true,
  });

  // Use documentSync, updateBlock, etc. for fine-grained control
}
```

### Starting a Session

The `CollabAssistant` component provides a UI for starting sessions:

```tsx
import CollabAssistant from '@/components/collab-assistant';

// The component handles session creation and displays the room ID
<CollabAssistant />
```

## Session Types

### Persistent Sessions
- Collaborators can join and edit anytime
- Sessions persist across user sessions
- Stored in Firebase Firestore
- Ideal for long-term collaborative projects

### Live Sessions
- Active, real-time sessions
- Owner controls the session lifecycle
- Automatically ends when owner disconnects
- Ideal for focused collaboration sessions

## WebSocket Server

The collaboration feature requires a WebSocket server for real-time synchronization. 

### Options:

1. **Public Demo Server** (default fallback)
   - Uses `wss://demos.yjs.dev`
   - Good for testing and development
   - Not recommended for production

2. **Custom Server**
   - Deploy your own y-websocket server
   - Full control and privacy
   - Recommended for production

3. **Firebase Realtime Database** (future enhancement)
   - Use Firebase as the sync backend
   - No separate server required
   - Good for small to medium deployments

### Deploying a Custom Server

Example using Node.js:

```javascript
const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', setupWSConnection);

server.listen(process.env.PORT || 1234);
```

## Offline Support

The implementation includes fallback mechanisms for poor connectivity:

1. **Local-first editing**: Changes are made locally first
2. **Sync queue**: Changes are queued when offline
3. **Auto-reconnection**: Automatic reconnection attempts
4. **Document locking**: Prevents conflicts during poor connectivity

## Security Considerations

1. **Authentication**: Users must be authenticated via Firebase
2. **Room access**: Room IDs should be kept private
3. **Data validation**: All document changes are validated
4. **Rate limiting**: Consider implementing rate limits on the WebSocket server

## Performance

- Uses CRDT for efficient conflict resolution
- Minimal network overhead (only changes are transmitted)
- Optimistic updates for responsive UI
- Debounced presence updates to reduce traffic

## Future Enhancements

1. **Cursor tracking**: Visual cursor positions for collaborators
2. **Comments and annotations**: Inline commenting system
3. **Version control**: Automatic versioning of collaborative sessions
4. **Access control**: Fine-grained permissions for collaborators
5. **Conflict resolution UI**: Visual diff for manual conflict resolution
6. **Rich presence**: Show what users are editing in real-time

## Dependencies

- `yjs`: ^13.x - CRDT library
- `y-websocket`: ^1.x - WebSocket provider for Yjs
- `y-protocols`: ^1.x - Awareness and sync protocols
- `lib0`: ^0.x - Utility library for Yjs

## Troubleshooting

### Connection Issues

- Verify WebSocket URL is accessible
- Check firewall settings
- Ensure WebSocket server is running
- Review browser console for errors

### Sync Problems

- Clear browser cache and reload
- Check network connectivity
- Verify all clients use the same room ID
- Review server logs for errors

### Performance Issues

- Reduce number of active collaborators
- Optimize document size
- Implement debouncing for rapid changes
- Consider upgrading WebSocket server resources

## API Reference

See individual service files for detailed API documentation:

- [CollaborationProvider.ts](./src/services/collab/CollaborationProvider.ts)
- [PresenceManager.ts](./src/services/collab/PresenceManager.ts)
- [DocumentSyncService.ts](./src/services/collab/DocumentSyncService.ts)
- [SessionPersistenceService.ts](./src/services/collab/SessionPersistenceService.ts)
