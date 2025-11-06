
'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, collection, setDoc, serverTimestamp, query, orderBy, addDoc, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import type { Character } from '@/components/views/characters-view';
import type { Scene } from '@/components/views/scenes-view';
import type { Note } from '@/components/views/notes-view';
import { ScriptDocument, ScriptBlock, ScriptBlockType } from '@/lib/editor-types';
import { parseScreenplay, serializeScript } from '@/lib/screenplay-parser';
import type { Match } from '@/hooks/use-find-replace.tsx';


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
  insertBlockAfter: (currentBlockId: string, text?: string, type?: ScriptBlockType) => void;
  cycleBlockType: (blockId: string) => void;
  mergeWithPreviousBlock: (blockId: string) => void;
  deleteScene: (startBlockIndex: number, blockCount: number) => void;
  addComment: (blockId: string, content: string) => void;
  isScriptLoading: boolean;
  characters: Character[] | null;
  scenes: Scene[] | null;
  notes: Note[] | null;
  comments: Comment[] | null;
  saveStatus: SaveStatus;
  activeMatch: Match | null;
  setActiveMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  activeBlockId: string | null;
  setActiveBlockId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const ScriptContext = createContext<ScriptContextType>({
  script: null,
  document: null,
  setBlocks: () => {},
  setScriptTitle: () => {},
  setScriptLogline: () => {},
  insertBlockAfter: () => {},
  cycleBlockType: () => {},
  mergeWithPreviousBlock: () => {},
  deleteScene: () => {},
  addComment: () => {},
  isScriptLoading: true,
  characters: null,
  scenes: null,
  notes: null,
  comments: null,
  saveStatus: 'idle',
  activeMatch: null,
  setActiveMatch: () => {},
  activeBlockId: null,
  setActiveBlockId: () => {},
});

export const ScriptProvider = ({ children, scriptId }: { children: ReactNode, scriptId: string }) => {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [localScript, setLocalScript] = useState<Script | null>(null);
  const [localDocument, setLocalDocument] = useState<ScriptDocument | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);


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
        
        const newVersionRef = doc(versionsCollectionRef);
        batch.set(newVersionRef, versionData);

        batch.set(scriptDocRef, mainScriptUpdateData, { merge: true });

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
  
  useEffect(() => {
    if (firestoreScript && isInitialLoad) {
        setLocalScript(firestoreScript);
        setLocalDocument(parseScreenplay(firestoreScript.content));
        setIsInitialLoad(false);
    } else if (!scriptId && isInitialLoad) {
        setLocalScript(null);
        setLocalDocument(null);
        setIsInitialLoad(false);
    }
  }, [firestoreScript, isInitialLoad, scriptId]);

  useEffect(() => {
    if (!isInitialLoad) {
      updateFirestore();
    }
  }, [debouncedDocument, debouncedTitle, debouncedLogline, isInitialLoad, updateFirestore]);

  // Sync scenes from script blocks to Firestore
  const syncScenesToFirestore = useCallback(async () => {
    if (isInitialLoad || !localDocument || !scenesCollection || !scenes) return;

    // Extract scene headings from the document
    const sceneHeadings: { sceneNumber: number; setting: string }[] = [];
    let sceneCounter = 0;

    localDocument.blocks.forEach((block) => {
      if (block.type === ScriptBlockType.SCENE_HEADING) {
        sceneCounter++;
        sceneHeadings.push({
          sceneNumber: sceneCounter,
          setting: block.text.trim(),
        });
      }
    });

    // Build a map of existing scenes by scene number for quick lookup
    const existingScenesMap = new Map(scenes.map(s => [s.sceneNumber, s]));

    // Sync scenes to Firestore
    const batch = writeBatch(firestore);
    let hasChanges = false;

    // Update or create scenes for each heading found
    sceneHeadings.forEach(({ sceneNumber, setting }) => {
      const existingScene = existingScenesMap.get(sceneNumber);
      
      if (existingScene) {
        // Only update if setting has changed
        if (existingScene.setting !== setting) {
          const sceneRef = doc(scenesCollection, existingScene.id);
          batch.set(sceneRef, { setting }, { merge: true });
          hasChanges = true;
        }
        // Remove from map to track which scenes still exist
        existingScenesMap.delete(sceneNumber);
      } else {
        // Create new scene with default values
        const newSceneRef = doc(scenesCollection);
        batch.set(newSceneRef, {
          sceneNumber,
          setting,
          description: '',
          time: 5, // default 5 minutes
        });
        hasChanges = true;
      }
    });

    // Delete scenes that no longer have corresponding scene headings
    existingScenesMap.forEach((scene) => {
      const sceneRef = doc(scenesCollection, scene.id);
      batch.delete(sceneRef);
      hasChanges = true;
    });

    // Commit the batch only if there are changes
    if (hasChanges) {
      try {
        await batch.commit();
      } catch (error) {
        console.error('Error syncing scenes:', error);
        const permissionError = new FirestorePermissionError({
          path: scenesCollection.path,
          operation: 'write',
          requestResourceData: { sceneHeadings }
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    }
  }, [isInitialLoad, localDocument, scenesCollection, scenes, firestore]);

  // Trigger scene sync when document changes (debounced)
  useEffect(() => {
    if (!isInitialLoad && debouncedDocument) {
      syncScenesToFirestore();
    }
  }, [debouncedDocument, isInitialLoad, syncScenesToFirestore]);

  // Sync characters from script blocks to Firestore
  const syncCharactersToFirestore = useCallback(async () => {
    if (isInitialLoad || !localDocument || !charactersCollectionRef || !characters) return;

    // Extract unique character names from the document
    const characterNames = new Set<string>();
    const characterSceneSets = new Map<string, Set<number>>();
    let currentSceneNumber = 0;

    localDocument.blocks.forEach((block) => {
      if (block.type === ScriptBlockType.SCENE_HEADING) {
        currentSceneNumber++;
      } else if (block.type === ScriptBlockType.CHARACTER) {
        const characterName = block.text.trim()
          .replace(/\(V\.O\.\)/gi, '')
          .replace(/\(O\.S\.\)/gi, '')
          .trim();
        
        if (characterName && currentSceneNumber > 0) {
          characterNames.add(characterName);
          
          // Track unique scenes this character appears in
          if (!characterSceneSets.has(characterName)) {
            characterSceneSets.set(characterName, new Set());
          }
          characterSceneSets.get(characterName)!.add(currentSceneNumber);
        }
      }
    });

    // Build a map of existing characters by name for quick lookup
    const existingCharactersMap = new Map(characters.map(c => [c.name, c]));

    // Sync characters to Firestore
    const batch = writeBatch(firestore);
    let hasChanges = false;

    // Update or create characters for each name found
    characterNames.forEach((name) => {
      const existingCharacter = existingCharactersMap.get(name);
      const sceneCount = characterSceneSets.get(name)?.size || 0;
      
      if (existingCharacter) {
        // Only update if scene count has changed
        if (existingCharacter.scenes !== sceneCount) {
          const charRef = doc(charactersCollectionRef, existingCharacter.id);
          batch.set(charRef, { scenes: sceneCount }, { merge: true });
          hasChanges = true;
        }
        // Remove from map to track which characters still exist
        existingCharactersMap.delete(name);
      } else {
        // Create new character with default values
        const newCharRef = doc(charactersCollectionRef);
        batch.set(newCharRef, {
          name,
          description: '',
          profile: '',
          scenes: sceneCount,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        hasChanges = true;
      }
    });

    // Delete characters that no longer appear in the script
    existingCharactersMap.forEach((character) => {
      const charRef = doc(charactersCollectionRef, character.id!);
      batch.delete(charRef);
      hasChanges = true;
    });

    // Commit the batch only if there are changes
    if (hasChanges) {
      try {
        await batch.commit();
      } catch (error) {
        console.error('Error syncing characters:', error);
        const permissionError = new FirestorePermissionError({
          path: charactersCollectionRef.path,
          operation: 'write',
          requestResourceData: { characterNames: Array.from(characterNames) }
        });
        errorEmitter.emit('permission-error', permissionError);
      }
    }
  }, [isInitialLoad, localDocument, charactersCollectionRef, characters, firestore]);

  // Trigger character sync when document changes (debounced)
  useEffect(() => {
    if (!isInitialLoad && debouncedDocument) {
      syncCharactersToFirestore();
    }
  }, [debouncedDocument, isInitialLoad, syncCharactersToFirestore]);


  const setBlocks = useCallback((blocks: ScriptBlock[]) => {
    setLocalDocument(prevDoc => prevDoc ? { ...prevDoc, blocks } : { blocks });
  }, []);

  const setScriptTitle = useCallback((title: string) => {
    setLocalScript(prev => prev ? { ...prev, title } : null);
  }, []);
  
  const setScriptLogline = useCallback((logline: string) => {
    setLocalScript(prev => prev ? { ...prev, logline } : null);
  }, []);

  const insertBlockAfter = useCallback((currentBlockId: string, text = '', type?: ScriptBlockType) => {
    setLocalDocument(prevDoc => {
      if (!prevDoc) return null;
      const index = prevDoc.blocks.findIndex(b => b.id === currentBlockId);
      if (index === -1) return prevDoc;
      const currentBlock = prevDoc.blocks[index];
      
      let newBlockType: ScriptBlockType = type || ScriptBlockType.ACTION;
      if (!type) {
         if (currentBlock.type === ScriptBlockType.SCENE_HEADING) {
            newBlockType = ScriptBlockType.ACTION;
        } else if (currentBlock.type === ScriptBlockType.CHARACTER) {
            newBlockType = ScriptBlockType.DIALOGUE;
        } else if (currentBlock.type === ScriptBlockType.DIALOGUE && text.trim() === '') {
            newBlockType = ScriptBlockType.ACTION;
        } else {
            newBlockType = ScriptBlockType.ACTION;
        }
      }


      const newBlock: ScriptBlock = {
        id: `block_${Date.now()}_${Math.random()}`,
        type: newBlockType,
        text: text,
      };

      const newBlocks = [...prevDoc.blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      
      setTimeout(() => {
        const newElement = document.querySelector(`[data-block-id="${newBlock.id}"]`) as HTMLElement;
        if (newElement) {
          newElement.focus();
        }
      }, 0);

      return { ...prevDoc, blocks: newBlocks };
    });
  }, []);

  const cycleBlockType = (blockId: string) => {
    const typeCycle: ScriptBlockType[] = [
      ScriptBlockType.ACTION,
      ScriptBlockType.CHARACTER,
      ScriptBlockType.PARENTHETICAL,
      ScriptBlockType.DIALOGUE,
      ScriptBlockType.TRANSITION,
      ScriptBlockType.SCENE_HEADING,
      ScriptBlockType.CENTERED,
      ScriptBlockType.SECTION,
      ScriptBlockType.SYNOPSIS,
    ];
    
    setLocalDocument(prevDoc => {
      if (!prevDoc) return null;
      const blockIndex = prevDoc.blocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return prevDoc;

      const currentBlock = prevDoc.blocks[blockIndex];
      const currentTypeIndex = typeCycle.indexOf(currentBlock.type);
      const nextTypeIndex = (currentTypeIndex + 1) % typeCycle.length;
      const newType = typeCycle[nextTypeIndex];
      
      const updatedBlock = { ...currentBlock, type: newType };
      const newBlocks = [...prevDoc.blocks];
      newBlocks[blockIndex] = updatedBlock;

      return { ...prevDoc, blocks: newBlocks };
    });
  };

  const mergeWithPreviousBlock = useCallback((blockId: string) => {
    setLocalDocument(prevDoc => {
        if (!prevDoc) return null;
        const index = prevDoc.blocks.findIndex(b => b.id === blockId);

        if (index <= 0) return prevDoc;

        const currentBlock = prevDoc.blocks[index];
        const prevBlock = prevDoc.blocks[index - 1];
        
        const newBlocks = [...prevDoc.blocks];
        const originalPrevTextLength = prevBlock.text.length;

        // Merge text and remove the current block
        prevBlock.text += currentBlock.text;
        newBlocks.splice(index, 1);
        
        setTimeout(() => {
            const prevElement = document.querySelector(`[data-block-id="${prevBlock.id}"]`) as HTMLElement;
            if (prevElement) {
                prevElement.focus();
                const selection = window.getSelection();
                const range = document.createRange();
                
                // Check if the element has any child nodes. If not, we can't set a range.
                if (prevElement.childNodes.length > 0) {
                    // It's safer to work with the element itself if it contains text directly,
                    // or traverse to the last text node.
                    let textNode: Node = prevElement;
                    while(textNode.lastChild) {
                        textNode = textNode.lastChild;
                    }

                    // Ensure cursor position is valid. Use textNode.textContent as it contains the actual text.
                    const newCursorPos = Math.min(originalPrevTextLength, textNode.textContent?.length || 0);

                    try {
                        range.setStart(textNode, newCursorPos);
                        range.collapse(true); // This collapses the range to its start point (the cursor).
                        
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                    } catch (e) {
                         console.error("Failed to set cursor position after merge:", e);
                    }
                }
            }
        }, 0);
        
        return { ...prevDoc, blocks: newBlocks };
    });
}, []);

  const deleteScene = useCallback((startBlockIndex: number, blockCount: number) => {
    setLocalDocument(prevDoc => {
      if (!prevDoc) return null;
      
      const newBlocks = [...prevDoc.blocks];
      // Remove all blocks in the scene
      newBlocks.splice(startBlockIndex, blockCount);
      
      // Focus on the previous block if available, or next block if this was the first scene
      setTimeout(() => {
        if (newBlocks.length > 0) {
          // If deleting from start, focus first remaining block; otherwise focus previous block
          const targetIndex = Math.min(startBlockIndex > 0 ? startBlockIndex - 1 : 0, newBlocks.length - 1);
          const targetBlock = newBlocks[targetIndex];
          const targetElement = document.querySelector(`[data-block-id="${targetBlock.id}"]`) as HTMLElement;
          if (targetElement) {
            targetElement.focus();
          }
        }
      }, 0);
      
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
    insertBlockAfter,
    cycleBlockType,
    mergeWithPreviousBlock,
    deleteScene,
    addComment,
    isScriptLoading,
    characters,
    scenes,
    notes,
    comments,
    saveStatus,
    activeMatch,
    setActiveMatch,
    activeBlockId,
    setActiveBlockId,
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
