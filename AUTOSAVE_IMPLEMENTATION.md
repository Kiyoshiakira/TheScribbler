# Autosave and Offline Editing Implementation

This document describes the autosave and offline editing features implemented for The Scribbler.

## Overview

The implementation provides:
- **Automatic saving** of content to IndexedDB every 2 seconds (configurable)
- **Draft recovery** when reopening the editor with unsaved content
- **Offline editing** with local-first persistence
- **Online/offline detection** with automatic sync when reconnected
- **Service Worker** for PWA offline support

## Architecture

### Core Components

#### 1. Save Manager (`src/utils/saveManager.ts`)
Central service for managing drafts and offline persistence.

**Features:**
- IndexedDB storage using `idb-keyval`
- Online/offline detection
- Draft CRUD operations
- Sync queue management for offline changes
- Singleton pattern for global access

**Key Methods:**
- `saveDraft(id, content, metadata)` - Save a draft
- `getDraft(id)` - Retrieve a draft
- `deleteDraft(id)` - Delete a draft
- `getUnsyncedDrafts()` - Get all unsynced drafts
- `isOnline()` - Check online status
- `addStatusListener(callback)` - Listen for online/offline changes

#### 2. Autosave Hook (`src/hooks/useAutosave.ts`)
React hook providing autosave functionality.

**Features:**
- Configurable debounce delay (default: 2000ms)
- Automatic save on blur
- Save before page unload
- Save status tracking
- Manual save trigger

**Usage:**
```typescript
const { isSaving, lastSaved, saveNow, isOnline, lastError } = useAutosave({
  id: 'unique-draft-id',
  content: content,
  enabled: true,
  debounceMs: 2000,
  metadata: { title: 'Chapter 1' },
  onSaveSuccess: () => console.log('Saved!'),
  onSaveError: (error) => console.error('Save failed:', error),
});
```

#### 3. Draft Recovery Dialog (`src/components/DraftRecoveryDialog.tsx`)
Modal dialog for recovering unsaved drafts.

**Features:**
- Automatically checks for drafts on mount
- Shows draft age and word count
- Allows recovery or discard
- Cleans up drafts after user choice

**Usage:**
```typescript
<DraftRecoveryDialog
  draftId="chapter-1"
  onRecover={(content, metadata) => {
    setContent(content);
    // Restore metadata if needed
  }}
  onDiscard={() => console.log('Draft discarded')}
/>
```

#### 4. Service Worker (`public/sw.js`)
PWA service worker for offline caching.

**Features:**
- Caches static assets
- Network-first with cache fallback
- Offline page support
- Auto-cleanup of old caches

#### 5. Service Worker Initializer (`src/components/ServiceWorkerInitializer.tsx`)
Client component that registers the service worker.

**Features:**
- Registers service worker in production
- Shows toast notifications for:
  - Update availability
  - Going offline
  - Coming back online

### Integration Points

#### MarkdownEditor Component
Enhanced with autosave capabilities:

```typescript
<MarkdownEditor
  value={content}
  onChange={setContent}
  autosaveEnabled={true}
  autosaveId="unique-id"
  autosaveDebounce={2000}
  autosaveMetadata={{ title: 'My Chapter' }}
/>
```

**UI Indicators:**
- Cloud icon (online) / Cloud-off icon (offline)
- "Saving..." indicator when saving
- "Saved X ago" timestamp after successful save
- Manual save button

#### Chapters Tab
Integrated autosave and draft recovery:

1. **Draft Recovery**: Shows dialog on opening chapter editor if unsaved draft exists
2. **Autosave**: Automatically saves chapter content every 2 seconds
3. **Cleanup**: Removes draft after successful save to database

## Data Flow

### Save Flow
1. User types in editor
2. Content change triggers debounced autosave (2s delay)
3. `useAutosave` hook calls `saveManager.saveDraft()`
4. Draft saved to IndexedDB with metadata
5. If offline, draft marked as unsynced
6. UI updates to show save status

### Recovery Flow
1. User opens editor
2. `DraftRecoveryDialog` checks for existing draft
3. If found, shows modal with draft details
4. User chooses to recover or discard
5. If recovered, content loaded into editor
6. Draft deleted from IndexedDB

### Offline/Online Flow
1. Browser goes offline
2. `saveManager` detects offline event
3. UI shows offline indicator
4. Drafts saved locally with `synced: false`
5. Browser comes back online
6. `saveManager` detects online event
7. UI shows online indicator
8. User can manually sync changes to server

## Configuration

### Debounce Delay
Default: 2000ms (2 seconds)
Can be customized per component:

```typescript
<MarkdownEditor
  autosaveDebounce={5000} // 5 seconds
  // ...
/>
```

### Draft Storage
- **Storage**: IndexedDB via `idb-keyval`
- **Store Name**: `TheScribbler-Drafts`
- **Database**: `drafts`

### Service Worker
- **Cache Name**: `the-scribbler-v1`
- **Enabled**: Production only
- **Strategy**: Network-first with cache fallback

## Testing

### Manual Testing Checklist
- [ ] Type in editor and verify autosave indicator appears
- [ ] Wait 2 seconds and verify "Saved" message appears
- [ ] Close editor without saving and reopen - verify draft recovery dialog
- [ ] Recover draft and verify content is restored
- [ ] Discard draft and verify editor is empty
- [ ] Go offline (DevTools Network tab) and verify offline indicator
- [ ] Type while offline and verify saves still work
- [ ] Come back online and verify online indicator
- [ ] Close browser tab and verify beforeunload warning (if changes unsaved)

### Browser DevTools

**IndexedDB Inspection:**
1. Open DevTools > Application tab
2. Expand IndexedDB
3. Look for `TheScribbler-Drafts` database
4. Inspect stored drafts

**Service Worker:**
1. Open DevTools > Application tab
2. Click "Service Workers"
3. Verify service worker is registered
4. Test offline mode

## Future Enhancements

Potential improvements:
1. **Conflict Resolution**: Handle conflicts when syncing offline changes
2. **Draft History**: Keep multiple versions of drafts
3. **Compression**: Compress large drafts before storage
4. **Encryption**: Encrypt sensitive draft content
5. **Sync Progress**: Show progress bar when syncing large drafts
6. **Multi-device Sync**: Sync drafts across devices via cloud
7. **Auto-delete**: Automatically delete old drafts after X days

## Dependencies

- `idb-keyval`: IndexedDB wrapper for simple key-value storage
- `use-debounce`: Debounce hook for React
- `date-fns`: Date formatting utilities

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support (with PWA)

**Requirements:**
- IndexedDB support
- Service Worker support (for offline mode)
- LocalStorage (fallback, not currently used)

## Troubleshooting

### Autosave not working
- Check browser console for errors
- Verify `autosaveEnabled` prop is `true`
- Verify `autosaveId` is provided and unique

### Draft recovery not showing
- Check IndexedDB in DevTools
- Verify draft exists with correct ID
- Check console for errors

### Service Worker not registering
- Only works in production mode
- Check HTTPS (required for SW except localhost)
- Check DevTools > Application > Service Workers

### Drafts not persisting
- Check browser storage quota
- Clear other storage if quota exceeded
- Check for IndexedDB errors in console

## Performance Considerations

- **Debouncing**: Prevents excessive saves during rapid typing
- **IndexedDB**: Asynchronous, non-blocking storage
- **Service Worker**: Runs in separate thread, doesn't block main thread
- **Memory**: Minimal memory footprint, stores in browser DB not RAM

## Security Notes

- Drafts stored locally in browser only
- No sensitive data transmitted during autosave
- User can clear drafts via browser storage settings
- Service Worker only caches public assets
