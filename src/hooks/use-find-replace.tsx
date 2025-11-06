'use client';

import { useState, useCallback, useContext, useEffect, createContext, ReactNode } from 'react';
import { useScript } from '@/context/script-context';

export interface Match {
  blockId: string;
  blockIndex: number;
  startIndex: number;
  endIndex: number;
}

interface FindReplaceContextType {
    findValue: string;
    setFindValue: (value: string) => void;
    replaceValue: string;
    setReplaceValue: (value: string) => void;
    matches: Match[];
    currentMatchIndex: number;
    matchCase: boolean;
    setMatchCase: (value: boolean) => void;
    wholeWord: boolean;
    setWholeWord: (value: boolean) => void;
    findMatches: () => void;
    navigateMatches: (direction: 'next' | 'prev') => void;
    handleReplace: () => void;
    handleReplaceAll: () => void;
    clearHighlights: () => void;
}

const FindReplaceContext = createContext<FindReplaceContextType | undefined>(undefined);

export const FindReplaceProvider = ({ children }: { children: ReactNode }) => {
  const { document, setBlocks, setActiveMatch } = useScript();
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const findMatches = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!findValue || !document) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      setActiveMatch(null);
      return;
    }

    const newMatches: Match[] = [];
    const flags = matchCase ? 'g' : 'gi';
    const regex = wholeWord
      ? new RegExp(`\\b${findValue}\\b`, flags)
      : new RegExp(findValue, flags);

    document.blocks.forEach((block, blockIndex) => {
      let match;
      while ((match = regex.exec(block.text)) !== null) {
        newMatches.push({
          blockId: block.id,
          blockIndex,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    });

    setMatches(newMatches);
    const newIndex = newMatches.length > 0 ? 0 : -1;
    setCurrentMatchIndex(newIndex);
    setActiveMatch(newMatches.length > 0 ? newMatches[0] : null);
  }, [findValue, document, matchCase, wholeWord, setActiveMatch]);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (matches.length > 0 && currentMatchIndex !== -1) {
        setActiveMatch(matches[currentMatchIndex]);
    } else {
        setActiveMatch(null);
    }
  }, [currentMatchIndex, matches, setActiveMatch]);

  const navigateMatches = (direction: 'next' | 'prev') => {
    if (matches.length === 0) return;
    const nextIndex =
      direction === 'next'
        ? (currentMatchIndex + 1) % matches.length
        : (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(nextIndex);
  };
  
  const clearHighlights = () => {
    if (typeof window === 'undefined') return;
    setActiveMatch(null);
  };

  const handleReplace = () => {
    if (currentMatchIndex === -1 || !document) return;
    const match = matches[currentMatchIndex];
    const block = document.blocks.find(b => b.id === match.blockId);
    if (!block) return;

    const newText =
      block.text.substring(0, match.startIndex) +
      replaceValue +
      block.text.substring(match.endIndex);

    const newBlocks = document.blocks.map(b =>
      b.id === match.blockId ? { ...b, text: newText } : b
    );
    setBlocks(newBlocks);

    setTimeout(() => {
        findMatches();
    }, 100);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0 || !document) return;

    const blockUpdates = new Map<string, string>();

    const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex);
    
    sortedMatches.forEach(match => {
        const currentText = blockUpdates.get(match.blockId) || document.blocks.find(b => b.id === match.blockId)?.text;
        if (currentText) {
            const newText = currentText.substring(0, match.startIndex) + replaceValue + currentText.substring(match.endIndex);
            blockUpdates.set(match.blockId, newText);
        }
    });

    const newBlocks = document.blocks.map(block => {
        if (blockUpdates.has(block.id)) {
            return { ...block, text: blockUpdates.get(block.id)! };
        }
        return block;
    });

    setBlocks(newBlocks);
    setMatches([]);
    setCurrentMatchIndex(-1);
    setActiveMatch(null);
  };

  const value = {
    findValue,
    setFindValue,
    replaceValue,
    setReplaceValue,
    matches,
    currentMatchIndex,
    matchCase,
    setMatchCase,
    wholeWord,
    setWholeWord,
    findMatches,
    navigateMatches,
    handleReplace,
    handleReplaceAll,
    clearHighlights,
  };

  return <FindReplaceContext.Provider value={value}>{children}</FindReplaceContext.Provider>;
}

export const useFindReplace = () => {
  const context = useContext(FindReplaceContext);
  if (!context) {
    throw new Error('useFindReplace must be used within a FindReplaceProvider');
  }
  return context;
};
