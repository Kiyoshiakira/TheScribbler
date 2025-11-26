
'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, errorEmitter, FirestorePermissionError } from '@/firebase';
import { doc, collection, serverTimestamp, query, orderBy, addDoc, writeBatch } from 'firebase/firestore';
import { useDebounce } from 'use-debounce';
import type { Character } from '@/components/views/characters-view';
import type { Scene } from '@/components/views/scenes-view';
import type { Note } from '@/components/views/notes-view';
import { ScriptDocument, ScriptBlock, ScriptBlockType, DocumentVersion } from '@/lib/editor-types';
import { parseScreenplay, serializeScript } from '@/lib/screenplay-parser';
import type { Match } from '@/hooks/use-find-replace.tsx';
import { sanitizeFirestorePayload } from '@/lib/firestore-utils';

// Delay to ensure DOM has updated before focusing elements
const DOM_UPDATE_DELAY_MS = 10;

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
  skipToDialogue: (blockId: string) => void;
  mergeWithPreviousBlock: (blockId: string) => void;
  deleteBlock: (blockId: string) => void;
  deleteScene: (startBlockIndex: number, blockCount: number) => void;
  addComment: (blockId: string, content: string) => void;
  isScriptLoading: boolean;
  characters: Character[] | null;
  scenes: Scene[] | null;
  notes: Note[] | null;
  comments: Comment[] | null;
  versions: DocumentVersion[] | null;
  restoreVersion: (versionId: string) => Promise<void>;
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
  skipToDialogue: () => {},
  mergeWithPreviousBlock: () => {},
  deleteBlock: () => {},
  deleteScene: () => {},
  addComment: () => {},
  isScriptLoading: true,
  characters: null,
  scenes: null,
  notes: null,
  comments: null,
  versions: null,
  restoreVersion: async () => {},
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
  const { data: characters } = useCollection<Character>(charactersCollectionRef);

  const scenesCollection = useMemoFirebase(
    () => (user && firestore && scriptId ? collection(firestore, 'users', user.uid, 'scripts', scriptId, 'scenes') : null),
    [firestore, user, scriptId]
  );
  const scenesQuery = useMemoFirebase(
    () => (scenesCollection ? query(scenesCollection, orderBy('sceneNumber', 'asc')) : null),
    [scenesCollection]
  );
  const { data: scenes } = useCollection<Scene>(scenesQuery);
  
  const notesCollection = useMemoFirebase(
    () => (user && firestore && scriptId ? collection(firestore, 'users', user.uid, 'scripts', scriptId, 'notes') : null),
    [firestore, user, scriptId]
  );
  const { data: notes } = useCollection<Note>(notesCollection);

  const commentsCollectionRef = useMemoFirebase(
    () => (user && firestore && scriptId ? collection(firestore, 'users', user.uid, 'scripts', scriptId, 'comments') : null),
    [firestore, user, scriptId]
  );
  const commentsQuery = useMemoFirebase(
    () => (commentsCollectionRef ? query(commentsCollectionRef, orderBy('createdAt', 'asc')) : null),
    [commentsCollectionRef]
  );
  const { data: comments } = useCollection<Comment>(commentsQuery);

  const versionsCollectionRef = useMemoFirebase(
    () => (user && firestore && scriptId ? collection(firestore, 'users', user.uid, 'scripts', scriptId, 'versions') : null),
    [firestore, user, scriptId]
  );
  const versionsQuery = useMemoFirebase(
    () => (versionsCollectionRef ? query(versionsCollectionRef, orderBy('timestamp', 'desc')) : null),
    [versionsCollectionRef]
  );
  const { data: versions } = useCollection<DocumentVersion>(versionsQuery);

 const updateFirestore = useCallback(async () => {
    if (isInitialLoad || !scriptDocRef || !localScript || !localDocument) return;
    if (!scenesCollection || !scenes || !charactersCollectionRef || !characters) return;

    const newContent = serializeScript(localDocument);
    const somethingHasChanged =
      newContent.trim() !== firestoreScript?.content?.trim() ||
      localScript.title !== firestoreScript?.title ||
      localScript.logline !== firestoreScript?.logline;

    if (!somethingHasChanged) {
      return;
    }
    
    setSaveStatus('saving');

    try {
        // Create a single batch for all operations
        const batch = writeBatch(firestore);
        
        // 1. Add version snapshot
        const versionsCollectionRef = collection(scriptDocRef, 'versions');
        const versionData = sanitizeFirestorePayload({
            title: localScript.title,
            logline: localScript.logline || '',
            content: newContent,
            timestamp: serverTimestamp()
        });
        const newVersionRef = doc(versionsCollectionRef);
        batch.set(newVersionRef, versionData);

        // 2. Update main script
        const mainScriptUpdateData = sanitizeFirestorePayload({
            content: newContent,
            title: localScript.title,
            logline: localScript.logline || '',
            lastModified: serverTimestamp()
        });
        batch.set(scriptDocRef, mainScriptUpdateData, { merge: true });

        // 3. Sync scenes in the same batch
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

        const existingScenesMap = new Map(scenes.map(s => [s.sceneNumber, s]));

        sceneHeadings.forEach(({ sceneNumber, setting }) => {
          const existingScene = existingScenesMap.get(sceneNumber);
          
          if (existingScene) {
            if (existingScene.setting !== setting) {
              const sceneRef = doc(scenesCollection, existingScene.id);
              batch.set(sceneRef, { setting }, { merge: true });
            }
            existingScenesMap.delete(sceneNumber);
          } else {
            const newSceneRef = doc(scenesCollection);
            batch.set(newSceneRef, {
              sceneNumber,
              setting,
              description: '',
              time: 5,
            });
          }
        });

        existingScenesMap.forEach((scene) => {
          const sceneRef = doc(scenesCollection, scene.id);
          batch.delete(sceneRef);
        });

        // 4. Sync characters in the same batch
        const characterNames = new Set<string>();
        const characterSceneSets = new Map<string, Set<number>>();
        let currentSceneNumber = 0;

        localDocument.blocks.forEach((block) => {
          if (block.type === ScriptBlockType.SCENE_HEADING) {
            currentSceneNumber++;
          } else if (block.type === ScriptBlockType.CHARACTER) {
            const characterName = block.text.trim()
              .replace(/\((V\.O\.|O\.S\.)\)/gi, '')
              .trim();
            
            if (characterName && currentSceneNumber > 0) {
              characterNames.add(characterName);
              
              if (!characterSceneSets.has(characterName)) {
                characterSceneSets.set(characterName, new Set());
              }
              characterSceneSets.get(characterName)!.add(currentSceneNumber);
            }
          }
        });

        const existingCharactersMap = new Map(characters.map(c => [c.name, c]));

        characterNames.forEach((name) => {
          const existingCharacter = existingCharactersMap.get(name);
          const sceneCount = characterSceneSets.get(name)?.size || 0;
          
          if (existingCharacter) {
            if (existingCharacter.scenes !== sceneCount) {
              const charRef = doc(charactersCollectionRef, existingCharacter.id);
              batch.set(charRef, { scenes: sceneCount }, { merge: true });
            }
            existingCharactersMap.delete(name);
          } else {
            const newCharRef = doc(charactersCollectionRef);
            batch.set(newCharRef, {
              name,
              description: '',
              profile: '',
              scenes: sceneCount,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        });

        existingCharactersMap.forEach((character) => {
          if (character.id && character.scenes !== 0) {
            const charRef = doc(charactersCollectionRef, character.id);
            batch.set(charRef, { scenes: 0 }, { merge: true });
          }
        });

        // Commit the single unified batch
        await batch.commit();

        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
        console.error("Error saving script:", error);
        const permissionError = new FirestorePermissionError({
            path: scriptDocRef.path,
            operation: 'write',
            requestResourceData: { script: localScript, documentBlocks: localDocument.blocks.length }
        });
        errorEmitter.emit('permission-error', permissionError);
        setSaveStatus('idle');
    }
  }, [scriptDocRef, localScript, localDocument, firestoreScript, isInitialLoad, firestore, scenesCollection, scenes, charactersCollectionRef, characters]);
  
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
            // After CHARACTER, create PARENTHETICAL
            newBlockType = ScriptBlockType.PARENTHETICAL;
        } else if (currentBlock.type === ScriptBlockType.PARENTHETICAL) {
            // After PARENTHETICAL, create DIALOGUE
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

  const cycleBlockType = useCallback((blockId: string) => {
    // Screenplay-specific block types in typical screenplay order
    const typeCycle: ScriptBlockType[] = [
      ScriptBlockType.ACTION,
      ScriptBlockType.CHARACTER,
      ScriptBlockType.PARENTHETICAL,
      ScriptBlockType.DIALOGUE,
      ScriptBlockType.TRANSITION,
      ScriptBlockType.SCENE_HEADING,
      ScriptBlockType.SHOT,
    ];
    
    setLocalDocument(prevDoc => {
      if (!prevDoc) return null;
      const blockIndex = prevDoc.blocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return prevDoc;

      const currentBlock = prevDoc.blocks[blockIndex];
      const currentTypeIndex = typeCycle.indexOf(currentBlock.type);
      const nextTypeIndex = (currentTypeIndex + 1) % typeCycle.length;
      const newType = typeCycle[nextTypeIndex];
      
      // When switching to PARENTHETICAL, add opening parenthesis if not present
      let updatedText = currentBlock.text;
      if (newType === ScriptBlockType.PARENTHETICAL && !updatedText.startsWith('(')) {
        updatedText = '(' + updatedText;
      }
      // When switching away from PARENTHETICAL, remove wrapping parentheses if present
      if (currentBlock.type === ScriptBlockType.PARENTHETICAL && newType !== ScriptBlockType.PARENTHETICAL) {
        // Only remove if the entire text is wrapped in parentheses
        if (updatedText.startsWith('(') && updatedText.endsWith(')')) {
          updatedText = updatedText.slice(1, -1);
        }
      }
      
      const updatedBlock = { ...currentBlock, type: newType, text: updatedText };
      const newBlocks = [...prevDoc.blocks];
      newBlocks[blockIndex] = updatedBlock;

      return { ...prevDoc, blocks: newBlocks };
    });
  }, []);

  const skipToDialogue = useCallback((blockId: string) => {
    setLocalDocument(prevDoc => {
      if (!prevDoc) return null;
      const blockIndex = prevDoc.blocks.findIndex(b => b.id === blockId);
      if (blockIndex === -1) return prevDoc;

      const currentBlock = prevDoc.blocks[blockIndex];
      
      // Only convert CHARACTER and PARENTHETICAL to DIALOGUE
      if (currentBlock.type !== ScriptBlockType.CHARACTER && currentBlock.type !== ScriptBlockType.PARENTHETICAL) {
        return prevDoc;
      }
      
      let updatedText = currentBlock.text;
      
      // When switching from PARENTHETICAL to DIALOGUE, remove wrapping parentheses if present
      if (currentBlock.type === ScriptBlockType.PARENTHETICAL) {
        if (updatedText.startsWith('(') && updatedText.endsWith(')')) {
          updatedText = updatedText.slice(1, -1);
        }
      }
      
      const updatedBlock = { ...currentBlock, type: ScriptBlockType.DIALOGUE, text: updatedText };
      const newBlocks = [...prevDoc.blocks];
      newBlocks[blockIndex] = updatedBlock;

      return { ...prevDoc, blocks: newBlocks };
    });
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setLocalDocument(prevDoc => {
      if (!prevDoc) return null;
      const index = prevDoc.blocks.findIndex(b => b.id === blockId);
      if (index === -1) return prevDoc;
      
      const newBlocks = [...prevDoc.blocks];
      newBlocks.splice(index, 1);
      
      // Focus on the previous block if available, or next block if this was the first block
      setTimeout(() => {
        if (newBlocks.length > 0) {
          const targetIndex = Math.min(index > 0 ? index - 1 : 0, newBlocks.length - 1);
          const targetBlock = newBlocks[targetIndex];
          const targetElement = document.querySelector(`[data-block-id="${targetBlock.id}"]`) as HTMLElement;
          if (targetElement && targetElement.focus) {
            targetElement.focus();
            // Move cursor to end of block
            const range = document.createRange();
            const selection = window.getSelection();
            if (targetElement.childNodes.length > 0) {
              const lastNode = targetElement.childNodes[targetElement.childNodes.length - 1];
              const length = lastNode.textContent?.length || 0;
              try {
                range.setStart(lastNode, length);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);
              } catch (error) {
                // Cursor positioning failed, but focus succeeded which is acceptable
                console.debug('Could not set cursor position after block deletion:', error);
              }
            }
          }
        }
      }, DOM_UPDATE_DELAY_MS);
      
      return { ...prevDoc, blocks: newBlocks };
    });
  }, []);

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

      addDoc(commentsCollectionRef, newComment).catch(() => {
          const permissionError = new FirestorePermissionError({
              path: commentsCollectionRef.path,
              operation: 'create',
              requestResourceData: newComment,
          });
          errorEmitter.emit('permission-error', permissionError);
      });

  }, [commentsCollectionRef, user]);

  const restoreVersion = useCallback(async (versionId: string) => {
    if (!versions || !scriptDocRef) return;
    
    const version = versions.find(v => v.id === versionId);
    if (!version) return;
    
    try {
      // Parse the version content and restore it
      const restoredDocument = parseScreenplay(version.content);
      
      // Update local state immediately
      setLocalScript(prev => prev ? {
        ...prev,
        title: version.title,
        logline: version.logline,
      } : null);
      setLocalDocument(restoredDocument);
      
      // The debounced save will handle persisting to Firestore
    } catch (error) {
      console.error("Error restoring version:", error);
    }
  }, [versions, scriptDocRef]);
  
  const isScriptLoading = isInitialLoad || (!!scriptId && isDocLoading);

  const value = { 
    script: localScript,
    document: localDocument,
    setBlocks,
    setScriptTitle,
    setScriptLogline,
    insertBlockAfter,
    cycleBlockType,
    skipToDialogue,
    mergeWithPreviousBlock,
    deleteBlock,
    deleteScene,
    addComment,
    isScriptLoading,
    characters,
    scenes,
    notes,
    comments,
    versions,
    restoreVersion,
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
