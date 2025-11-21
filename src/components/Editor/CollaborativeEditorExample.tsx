/**
 * @fileoverview Example integration of CollaborativeEditor with script editor
 * 
 * This file demonstrates how to integrate real-time collaboration into
 * an existing editor component.
 */

'use client';

import React, { useState, useCallback } from 'react';
import CollaborativeEditor from '@/components/Editor/CollaborativeEditor';
import { ScriptDocument } from '@/lib/editor-types';
import { useCollaboration } from '@/hooks/use-collaboration';

interface CollaborativeScriptEditorProps {
  roomId: string;
  initialDocument: ScriptDocument;
  websocketUrl?: string;
}

/**
 * Example: Collaborative Script Editor
 * 
 * This component demonstrates how to wrap an editor with real-time collaboration.
 * It demonstrates:
 * - Document synchronization across clients
 * - Real-time presence indicators
 * - Connection status display
 * - Cursor/selection tracking (when integrated with editor)
 */
export function CollaborativeScriptEditor({
  roomId,
  initialDocument,
  websocketUrl,
}: CollaborativeScriptEditorProps) {
  const [document, setDocument] = useState<ScriptDocument>(initialDocument);

  // Handle document changes from collaboration
  const handleDocumentChange = useCallback((newDoc: ScriptDocument) => {
    setDocument(newDoc);
  }, []);

  return (
    <CollaborativeEditor
      roomId={roomId}
      initialDocument={initialDocument}
      onDocumentChange={handleDocumentChange}
      websocketUrl={websocketUrl}
    >
      <div className="p-4">
        {/* Your existing editor component would go here */}
        {/* Example: <ScriptEditor /> */}
        <div className="space-y-2">
          {document.blocks.map((block) => (
            <div key={block.id} className="p-2 border rounded">
              <div className="text-xs text-muted-foreground mb-1">{block.type}</div>
              <div>{block.text}</div>
            </div>
          ))}
        </div>
      </div>
    </CollaborativeEditor>
  );
}

/**
 * Example: Using the collaboration hook directly
 * 
 * For more control, you can use the useCollaboration hook directly
 * instead of the CollaborativeEditor wrapper component.
 */
export function AdvancedCollaborativeEditor({
  roomId,
  initialDocument,
  websocketUrl,
}: CollaborativeScriptEditorProps) {
  const [localDocument, setLocalDocument] = useState<ScriptDocument>(initialDocument);

  // Use the collaboration hook
  const {
    documentSync,
    connectionStatus,
    activeUsers,
    updateBlock,
    updateCursor,
  } = useCollaboration({
    roomId,
    initialDocument,
    websocketUrl,
    enabled: true,
  });

  // Subscribe to document updates from collaboration
  React.useEffect(() => {
    if (!documentSync) return;

    const unsubscribe = documentSync.onUpdate((doc) => {
      setLocalDocument(doc);
    });

    return unsubscribe;
  }, [documentSync]);

  // Handle block updates
  const handleBlockUpdate = useCallback(
    (blockId: string, text: string) => {
      // Update locally
      const updatedDoc = {
        ...localDocument,
        blocks: localDocument.blocks.map((block) =>
          block.id === blockId ? { ...block, text } : block
        ),
      };
      setLocalDocument(updatedDoc);

      // Sync with collaborators
      if (documentSync) {
        updateBlock(blockId, { text });
      }
    },
    [localDocument, documentSync, updateBlock]
  );

  // Handle cursor position updates
  const handleCursorMove = useCallback(
    (blockId: string, offset: number) => {
      updateCursor(blockId, offset);
    },
    [updateCursor]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Connection status bar */}
      <div className="px-4 py-2 border-b bg-muted/30 flex items-center justify-between">
        <div className="text-sm">
          Status: <span className="font-medium">{connectionStatus}</span>
        </div>
        <div className="text-sm">
          Active users: <span className="font-medium">{activeUsers.size}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-4">
        {localDocument.blocks.map((block) => (
          <div key={block.id} className="mb-2">
            <input
              type="text"
              value={block.text}
              onChange={(e) => handleBlockUpdate(block.id, e.target.value)}
              onFocus={(e) => {
                const offset = e.target.selectionStart || 0;
                handleCursorMove(block.id, offset);
              }}
              className="w-full px-3 py-2 border rounded"
              placeholder={`Enter ${block.type}...`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Usage Example:
 * 
 * ```tsx
 * import { CollaborativeScriptEditor } from './components/Editor/CollaborativeEditorExample';
 * 
 * function MyApp() {
 *   const initialDocument = {
 *     blocks: [
 *       { id: '1', type: 'scene-heading', text: 'INT. OFFICE - DAY' },
 *       { id: '2', type: 'action', text: 'John enters the room.' },
 *     ],
 *   };
 * 
 *   return (
 *     <CollaborativeScriptEditor
 *       roomId="my-script-session"
 *       initialDocument={initialDocument}
 *       websocketUrl="wss://my-server.com/collab"
 *     />
 *   );
 * }
 * ```
 */
