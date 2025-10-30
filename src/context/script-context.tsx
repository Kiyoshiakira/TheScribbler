'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, collection, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import type { ScriptElement } from '@/components/script-editor';
import type { Character } from '@/components/views/characters-view';
import type { Scene } from '@/components/views/scenes-view';
import type { Note } from '@/components/views/notes-view';

interface Script {
    id: string;
    title: string;
    content: string; // The raw string content for Firestore
    logline?: string;
    [key: string]: any; 
}

export interface ScriptLine {
  id: string;
  type: ScriptElement;
  text: string;
}

interface ScriptContextType {
  script: Script | null;
  lines: ScriptLine[];
  characters: Character[] | null;
  scenes: Scene[] | null;
  notes: Note[] | null;
  setLines: (linesOrContent: ScriptLine[] | string | ((prev: ScriptLine[]) => ScriptLine[])) => void;
  setScriptTitle: (title: string) => void;
  setScriptLogline: (logline: string) => void;
  isScriptLoading: boolean;
}

export const ScriptContext = createContext<ScriptContextType>({
  script: null,
  lines: [],
  characters: null,
  scenes: null,
  notes: null,
  setLines: () => {},
  setScriptTitle: () => {},
  setScriptLogline: () => {},
  isScriptLoading: true,
});

// A more robust function to parse the raw script content into lines
const parseContentToLines = (content: string): ScriptLine[] => {
    if (typeof content !== 'string') return [];
    
    const rawLines = content.split('\n');
    const parsedLines: ScriptLine[] = [];

    for (let i = 0; i < rawLines.length; i++) {
        const text = rawLines[i];
        const trimmedText = text.trim();
        let type: ScriptElement = 'action'; // Default to action

        const isAllUpperCase = trimmedText === trimmedText.toUpperCase() && trimmedText !== '' && !/^[0-9()., -]+$/.test(trimmedText);
        const prevLine = parsedLines[i - 1];
        
        if (trimmedText.startsWith('INT.') || trimmedText.startsWith('EXT.') || trimmedText.startsWith('EST.')) {
            type = 'scene-heading';
        } else if (trimmedText.endsWith(' TO:')) {
            type = 'transition';
        } else if (trimmedText.startsWith('(') && trimmedText.endsWith(')')) {
            type = 'parenthetical';
        } else if (prevLine && (prevLine.type === 'character' || prevLine.type === 'parenthetical') && trimmedText !== '') {
            type = 'dialogue';
        } else if (isAllUpperCase && text.length < 35 && text.startsWith('  ')) {
             type = 'character';
        } else {
             type = 'action';
        }
        
        parsedLines.push({
            id: `line-${i}-${Date.now()}`,
            type,
            text,
        });
    }

    return parsedLines;
};


export const ScriptProvider = ({ children, scriptId }: { children: ReactNode, scriptId: string }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const [localScript, setLocalScript] = useState<Script | null>(null);
  const [lines, setLocalLines] = useState<ScriptLine[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const scriptDocRef = useMemoFirebase(
    () => (user && firestore && scriptId ? doc(firestore, 'users', user.uid, 'scripts', scriptId) : null),
    [user, firestore, scriptId]
  );
  
  const { data: firestoreScript, isLoading: isDocLoading } = useDoc<Script>(scriptDocRef);

  const [debouncedLines] = useDebounce(lines, 1000);

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

  const updateFirestore = useCallback((field: 'content' | 'title' | 'logline', value: string) => {
    if (scriptDocRef) {
        setDoc(scriptDocRef, { 
            [field]: value,
            lastModified: serverTimestamp()
        }, { merge: true }).catch(serverError => {
             const permissionError = new FirestorePermissionError({
                path: scriptDocRef.path,
                operation: 'update',
                requestResourceData: { [field]: value },
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }
  }, [scriptDocRef]);
  
  useEffect(() => {
    if (firestoreScript) {
        setLocalScript(firestoreScript);
        const currentContent = lines.map(line => line.text.replace(/<br>/g, '')).join('\n');
        if (firestoreScript.content !== currentContent) {
           const parsed = parseContentToLines(firestoreScript.content || '');
           setLocalLines(parsed);
        }
        if (isInitialLoad) setIsInitialLoad(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestoreScript]);


  useEffect(() => {
    if (isInitialLoad || debouncedLines.length === 0) {
        return;
    }
    const newContent = debouncedLines.map(line => line.text.replace(/<br\s*\/?>/gi, '')).join('\n');
    if (localScript && newContent !== localScript.content) {
      updateFirestore('content', newContent);
    }
  }, [debouncedLines, localScript, isInitialLoad, updateFirestore]);

  const setLines = useCallback((linesOrContent: ScriptLine[] | string | ((prev: ScriptLine[]) => ScriptLine[])) => {
    if (typeof linesOrContent === 'string') {
        const newLines = parseContentToLines(linesOrContent);
        setLocalLines(newLines);
    } else {
        setLocalLines(linesOrContent);
    }
  }, []);

  const setScriptTitle = (title: string) => {
    if (localScript && localScript.title !== title) {
        setLocalScript(prev => prev ? { ...prev, title } : null);
        updateFirestore('title', title);
    }
  };
  
  const setScriptLogline = (logline: string) => {
      if (localScript && localScript.logline !== logline) {
        setLocalScript(prev => prev ? { ...prev, logline } : null);
        updateFirestore('logline', logline);
      }
  }
  
  const value = { 
    script: localScript,
    lines,
    characters,
    scenes,
    notes,
    setLines,
    setScriptTitle,
    setScriptLogline,
    isScriptLoading: isDocLoading || areCharactersLoading || areScenesLoading || areNotesLoading || !localScript
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
