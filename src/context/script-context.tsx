
'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, collection, setDoc, serverTimestamp, query, orderBy, addDoc, getDocs, writeBatch } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import type { Character } from '@/components/views/characters-view';
import type { Scene } from '@/components/views/scenes-view';
import type { Note } from '@/components/views/notes-view';
import { ScriptDocument, ScriptBlock, ScriptBlockType } from '@/lib/editor-types';
import { parseScreenplay, serializeScript } from '@/lib/screenplay-parser';
import type { Match } from '@/hooks/use-find-replace';


interface Script {
    id: string;
    title: string;
    content: string; // The raw string content for Firestore
    logline?: string;
    [key: string]: any; 
}

export interface Comment {
    id: string;
    blockId: string;
    authorId: string;
    content: string;
    createdAt: any;
    updatedAt: any;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

interface ScriptContextType {
  script: Script | null;
  document: ScriptDocument | null; // The structured document
  setBlocks: (blocks: ScriptBlock[]) => void;
  setScriptTitle: (title: string) => void;
  setScriptLogline: (logline: string) => void;
  splitScene: (blockId: string) => void;
  addComment: (blockId: string, content: string) => void;
  isScriptLoading: boolean;
  characters: Character[] | null;
  scenes: Scene[] | null;
  notes: Note[] | null;
  comments: Comment[] | null;
  saveStatus: SaveStatus;
  activeMatch: Match | null;
  setActiveMatch: React.Dispatch<React.SetStateAction<Match | null>>;
}

export const ScriptContext = createContext<ScriptContextType>({
  script: null,
  document: null,
  setBlocks: () => {},
  setScriptTitle: () => {},
  setScriptLogline: () => {},
  splitScene: () => {},
  addComment: () => {},
  isScriptLoading: true,
  characters: null,
  scenes: null,
  notes: null,
  comments: null,
  saveStatus: 'idle',
  activeMatch: null,
  setActiveMatch: () => {},
});

export const ScriptProvider = ({ children, scriptId }: { children: ReactNode, scriptId: string }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [localScript, setLocalScript] = useState<Script | null>(null);
  const [localDocument, setLocalDocument] = useState<ScriptDocument | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);


  const scriptDocRef = useMemoFirebase(
    () => {
        if (user && firestore && scriptId) {
            return doc(firestore, 'users', user.uid, 'scripts', scriptId);
        }
        return null;
    },
    [user, firestore, scriptId]
  );
  
  const { data: firestoreScript, isLoading: isDocLoading } = useDoc<Script>(scriptDocRef);

  const [debouncedDocument] = useDebounce(localDocument, 1000);
  const [debouncedTitle] = useDebounce(localScript?.title, 1000);
  const [debouncedLogline] = useDebounce(localScript?.logline, 1000);

  const charactersCollectionRef = useMemoFirebase(
    () => (user && firestore && scriptId ? collection(firestore, 'users', user.uid, 'scripts', scriptId, 'characters') : null),
    [firestore, user, scriptId]
  );
  const { data: characters, isLoading: areCharactersLoading } = useCollection<Character>(charactersCollectionRef);

  const scenesCollection = useMemoFirebase(
    () => (user && firestore && scriptId ? collection(firestore, 'users', user.uid, 'scripts', scriptId, 'scenes') : null),
    [firestore, user, scriptId]
  );
  const scenesQuery = useMemoFirebase(
    () => (scenesCollection ? query(scenesCollection, orderBy('sceneNumber', 'asc')) : null),
    [scenesCollection]
  );
  const { data: scenes, isLoading: areScenesLoading } = useCollection<Scene>(scenesQuery);
  
  const notesCollection = useMemoFirebase(
    () => (user && firestore && scriptId ? collection(firestore, 'users', user.uid, 'scripts', scriptId, 'notes') : null),
    [firestore, user, scriptId]
  );
  const { data: notes, isLoading: areNotesLoading } = useCollection<Note>(notesCollection);

  const commentsCollectionRef = useMemoFirebase(
    () => (user && firestore && scriptId ? collection(firestore, 'users', user.uid, 'scripts', scriptId, 'comments') : null),
    [firestore, user, scriptId]
  );
  const commentsQuery = useMemoFirebase(
    () => (commentsCollectionRef ? query(commentsCollectionRef, orderBy('createdAt', 'asc')) : null),
    [commentsCollectionRef]
  );
  const { data: comments, isLoading: areCommentsLoading } = useCollection<Comment>(commentsQuery);

 const updateFirestore = useCallback(async () => {
    if (isInitialLoad || !scriptDocRef || !localScript) return;

    const newContent = localDocument ? serializeScript(localDocument) : localScript.content;
    const somethingHasChanged =
      newContent.trim() !== firestoreScript?.content?.trim() ||
      localScript.title !== firestoreScript?.title ||
      localScript.logline !== firestoreScript?.logline;

    if (!somethingHasChanged) {
      return;
    }
    
    setSaveStatus('saving');

    const versionsCollectionRef = collection(scriptDocRef, 'versions');
    const versionData = {
        title: localScript.title,
        logline: localScript.logline || '',
        content: newContent,
        timestamp: serverTimestamp()
    };
    const mainScriptUpdateData = {
        content: newContent,
        title: localScript.title,
        logline: localScript.logline,
        lastModified: serverTimestamp()
    }

    try {
        const batch = writeBatch(firestore);
        
        // Add a new document to the versions subcollection
        const newVersionRef = doc(versionsCollectionRef);
        batch.set(newVersionRef, versionData);

        // Update the main script document with all changes
        batch.update(scriptDocRef, mainScriptUpdateData);

        await batch.commit();

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
        console.error("Error saving script version:", error);
        const permissionError = new FirestorePermissionError({
            path: scriptDocRef.path,
            operation: 'write',
            requestResourceData: { version: versionData, mainUpdate: mainScriptUpdateData }
        });
        errorEmitter.emit('permission-error', permissionError);
        setSaveStatus('idle');
    }
  }, [scriptDocRef, localScript, localDocument, firestoreScript, isInitialLoad, firestore]);
  
  // Effect for initial data load
  useEffect(() => {
    if (firestoreScript && isInitialLoad) {
        setLocalScript(firestoreScript);
        setLocalDocument(parseScreenplay(firestoreScript.content));
        setIsInitialLoad(false);
    } else if (!scriptId && isInitialLoad) {
        // Handle case where there is no script ID
        setLocalScript(null);
        setLocalDocument(null);
        setIsInitialLoad(false);
    }
  }, [firestoreScript, isInitialLoad, scriptId]);

  // Debounced effect for saving ALL changes
  useEffect(() => {
    if (!isInitialLoad) {
      updateFirestore();
    }
  }, [debouncedDocument, debouncedTitle, debouncedLogline, isInitialLoad, updateFirestore]);


  const setBlocks = useCallback((blocks: ScriptBlock[]) => {
    setLocalDocument(prevDoc => prevDoc ? { ...prevDoc, blocks } : { blocks });
  }, []);

  const setScriptTitle = useCallback((title: string) => {
    setLocalScript(prev => prev ? { ...prev, title } : null);
  }, []);
  
  const setScriptLogline = useCallback((logline: string) => {
    setLocalScript(prev => prev ? { ...prev, logline } : null);
  }, []);

  const splitScene = useCallback((blockId: string) => {
    setLocalDocument(prevDoc => {
        if (!prevDoc) return null;

        const blockIndex = prevDoc.blocks.findIndex(b => b.id === blockId);
        if (blockIndex === -1) return prevDoc;

        const newSceneHeading: ScriptBlock = {
            id: `block_${Date.now()}`,
            type: ScriptBlockType.SCENE_HEADING,
            text: 'INT. NEW SCENE - DAY',
        };

        const newBlocks = [...prevDoc.blocks];
        newBlocks.splice(blockIndex + 1, 0, newSceneHeading);

        return { ...prevDoc, blocks: newBlocks };
    });
  }, []);

  const addComment = useCallback((blockId: string, content: string) => {
      if (!commentsCollectionRef || !user) return;
      
      const newComment = {
          blockId,
          content,
          authorId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
      };

      addDoc(commentsCollectionRef, newComment).catch(serverError => {
          const permissionError = new FirestorePermissionError({
              path: commentsCollectionRef.path,
              operation: 'create',
              requestResourceData: newComment,
          });
          errorEmitter.emit('permission-error', permissionError);
      });

  }, [commentsCollectionRef, user]);
  
  const isScriptLoading = isInitialLoad || (!!scriptId && isDocLoading);

  const value = { 
    script: localScript,
    document: localDocument,
    setBlocks,
    setScriptTitle,
    setScriptLogline,
    splitScene,
    addComment,
    isScriptLoading,
    characters,
    scenes,
    notes,
    comments,
    saveStatus,
    activeMatch,
    setActiveMatch,
  };

  return (
    <ScriptContext.Provider value={value}>
      {children}
    </ScriptContext.Provider>
  );
};

export const useScript = () => {
    const context = useContext(ScriptContext);
    if (!context) {
        throw new Error('useScript must be used within a ScriptProvider');
    }
    return context;
}
