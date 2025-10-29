'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import type { ScriptElement } from '@/components/script-editor';

interface Script {
    id: string;
    title: string;
    content: string; // The raw string content for Firestore
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
  setLines: (lines: ScriptLine[] | ((prev: ScriptLine[]) => ScriptLine[])) => void;
  setScriptTitle: (title: string) => void;
  isScriptLoading: boolean;
}

export const ScriptContext = createContext<ScriptContextType>({
  script: null,
  lines: [],
  setLines: () => {},
  setScriptTitle: () => {},
  isScriptLoading: true,
});

export const ScriptProvider = ({ children, scriptId }: { children: ReactNode, scriptId: string }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  const [localScript, setLocalScript] = useState<Script | null>(null);
  const [lines, setLines] = useState<ScriptLine[]>([]);

  const scriptDocRef = useMemoFirebase(
    () => (user && firestore && scriptId ? doc(firestore, 'users', user.uid, 'scripts', scriptId) : null),
    [user, firestore, scriptId]
  );
  
  const { data: firestoreScript, isLoading: isDocLoading } = useDoc<Script>(scriptDocRef);

  const [debouncedLines] = useDebounce(lines, 1000);

  // Function to parse the raw script content into lines
  const parseContentToLines = useCallback((content: string): ScriptLine[] => {
      if (typeof content !== 'string') return [];
      const lineTexts = content.split('\n');
      
      return lineTexts.map((text, index) => {
          let type: ScriptElement = 'action';
          const trimmedText = text.trim();

          if (trimmedText.startsWith('INT.') || trimmedText.startsWith('EXT.')) {
            type = 'scene-heading';
          } else if (trimmedText.startsWith('(') && trimmedText.endsWith(')')) {
            type = 'parenthetical';
          } else if (trimmedText.endsWith('TO:')) {
            type = 'transition';
          } else if (/^[A-Z\s]+$/.test(trimmedText) && trimmedText.length > 0 && trimmedText.length < 35 && !trimmedText.includes('(')) {
              // Heuristic for character: ALL CAPS, short, and not a transition.
              // Look at previous line to be more certain.
              const prevLine = lineTexts[index - 1]?.trim() ?? '';
              if (prevLine === '' || prevLine.endsWith('TO:')) { // Previous line was empty or a transition
                  type = 'character';
              }
          } else if (index > 0) {
              const prevLine = lineTexts[index - 1]?.trim() ?? '';
              const prevLineIsCharacter = /^[A-Z\s]+$/.test(prevLine) && prevLine.length < 35 && !prevLine.includes('(');
              if(prevLineIsCharacter) {
                  type = 'dialogue';
              }
          }

          return { id: `line-${index}-${Date.now()}`, type, text };
      });
  }, []);
  
  useEffect(() => {
    if (firestoreScript) {
        setLocalScript(firestoreScript);
        // Only parse content to lines if lines are not already set,
        // or if the firestore content has updated and is different from current lines.
        const currentContentFromLines = lines.map(line => line.text).join('\n');
        if (firestoreScript.content && firestoreScript.content !== currentContentFromLines) { 
            const parsed = parseContentToLines(firestoreScript.content);
            setLines(parsed);
        } else if (lines.length === 0 && firestoreScript.content) {
             const parsed = parseContentToLines(firestoreScript.content);
            setLines(parsed);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firestoreScript]);


  const updateFirestore = useCallback((field: 'content' | 'title', value: string) => {
    if (scriptDocRef) {
        setDoc(scriptDocRef, { 
            [field]: value,
            lastModified: serverTimestamp()
        }, { merge: true });
    }
  }, [scriptDocRef]);


  useEffect(() => {
    if (debouncedLines.length > 0) {
      const newContent = debouncedLines.map(line => line.text.replace(/<br>/g, '')).join('\n');
      if (firestoreScript && newContent !== firestoreScript.content) {
        updateFirestore('content', newContent);
      }
    }
  }, [debouncedLines, firestoreScript, updateFirestore]);


  const setScriptTitle = (title: string) => {
    setLocalScript(prev => prev ? { ...prev, title } : null);
    updateFirestore('title', title);
  };
  
  const value = { 
    script: localScript,
    lines,
    setLines,
    setScriptTitle,
    isScriptLoading: isDocLoading || !localScript
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
