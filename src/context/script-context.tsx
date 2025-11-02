'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, collection, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import type { Character } from '@/components/views/characters-view';
import type { Scene } from '@/components/views/scenes-view';
import type { Note } from '@/components/views/notes-view';
import { ScriptDocument, ScriptBlock } from '@/lib/editor-types';
import { parseScreenplay, serializeScript } from '@/lib/screenplay-parser';


interface Script {
    id: string;
    title: string;
    content: string; // The raw string content for Firestore
    logline?: string;
    [key: string]: any; 
}

interface ScriptContextType {
  script: Script | null;
  document: ScriptDocument | null; // The structured document
  setBlocks: (blocks: ScriptBlock[]) => void;
  setScriptTitle: (title: string) => void;
  setScriptLogline: (logline: string) => void;
  isScriptLoading: boolean;
  characters: Character[] | null;
  scenes: Scene[] | null;
  notes: Note[] | null;
}

export const ScriptContext = createContext<ScriptContextType>({
  script: null,
  document: null,
  setBlocks: () => {},
  setScriptTitle: () => {},
  setScriptLogline: () => {},
  isScriptLoading: true,
  characters: null,
  scenes: null,
  notes: null,
});

export const ScriptProvider = ({ children, scriptId }: { children: ReactNode, scriptId: string }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [localScript, setLocalScript] = useState<Script | null>(null);
  const [localDocument, setLocalDocument] = useState<ScriptDocument | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  console.log(`[ScriptContext] Provider mounted for scriptId: ${scriptId}`);

  const scriptDocRef = useMemoFirebase(
    () => {
        if (user && firestore && scriptId) {
            console.log(`[ScriptContext] Creating doc reference for scriptId: ${scriptId}`);
            return doc(firestore, 'users', user.uid, 'scripts', scriptId);
        }
        console.log('[ScriptContext] Cannot create doc reference. Missing user, firestore, or scriptId.');
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

  const updateFirestore = useCallback((dataToUpdate: Partial<Script>) => {
    if (scriptDocRef && Object.keys(dataToUpdate).length > 0) {
        console.log('[ScriptContext] Saving changes to Firestore:', dataToUpdate);
        const payload = { 
            ...dataToUpdate,
            lastModified: serverTimestamp()
        };
        setDoc(scriptDocRef, payload, { merge: true }).catch(serverError => {
             const permissionError = new FirestorePermissionError({
                path: scriptDocRef.path,
                operation: 'update',
                requestResourceData: payload,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
  }, [scriptDocRef]);
  
  // Effect for initial data load
  useEffect(() => {
    if (firestoreScript && isInitialLoad) {
        console.log('[ScriptContext] Initial load complete. Setting local script from Firestore.');
        setLocalScript(firestoreScript);
        setLocalDocument(parseScreenplay(firestoreScript.content));
        setIsInitialLoad(false);
    }
  }, [firestoreScript, isInitialLoad]);

  // Debounced effect for saving content changes
  useEffect(() => {
    if (isInitialLoad || !debouncedDocument) return;

    const newContent = serializeScript(debouncedDocument);
    // Only save if content has actually changed from what's in Firestore
    if (newContent.trim() !== firestoreScript?.content.trim()) {
      updateFirestore({ content: newContent });
    }
  }, [debouncedDocument, firestoreScript, isInitialLoad, updateFirestore]);

  // Debounced effect for saving title changes
  useEffect(() => {
    if (isInitialLoad || debouncedTitle === undefined) return;
    if (debouncedTitle !== firestoreScript?.title) {
        updateFirestore({ title: debouncedTitle });
    }
  }, [debouncedTitle, firestoreScript, isInitialLoad, updateFirestore]);

  // Debounced effect for saving logline changes
  useEffect(() => {
    if (isInitialLoad || debouncedLogline === undefined) return;
    if (debouncedLogline !== firestoreScript?.logline) {
        updateFirestore({ logline: debouncedLogline });
    }
  }, [debouncedLogline, firestoreScript, isInitialLoad, updateFirestore]);


  const setBlocks = useCallback((blocks: ScriptBlock[]) => {
    setLocalDocument({ blocks });
  }, []);

  const setScriptTitle = useCallback((title: string) => {
    setLocalScript(prev => prev ? { ...prev, title } : null);
  }, []);
  
  const setScriptLogline = useCallback((logline: string) => {
    setLocalScript(prev => prev ? { ...prev, logline } : null);
  }, []);
  
  const isScriptLoading = isInitialLoad || isDocLoading;
  console.log('[ScriptContext] State:', { isScriptLoading, hasLocalScript: !!localScript });

  const value = { 
    script: localScript,
    document: localDocument,
    setBlocks,
    setScriptTitle,
    setScriptLogline,
    isScriptLoading,
    characters,
    scenes,
    notes,
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
