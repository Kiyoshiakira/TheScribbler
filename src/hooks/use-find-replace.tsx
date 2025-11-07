'use client';

import { useState, useCallback, useContext, useEffect, createContext, ReactNode } from 'react';
import { useScript } from '@/context/script-context';

/**
 * Lightweight editor-agnostic find & replace hook
 * Uses window.__SCRIBBLER_EDITOR_CONTENT__ as a fallback for content access
 * Dispatches 'scribbler:content:changed' CustomEvent when content is modified
 */

export interface Match {
  blockId?: string;
  blockIndex?: number;
  startIndex: number;
  endIndex: number;
  text?: string;
}

// Extend Window interface to include our custom property
declare global {
  interface Window {
    __SCRIBBLER_EDITOR_CONTENT__?: string;
  }
}

// Context for block-based editor integration (backwards compatibility)
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
    if (!match.blockId) return; // Guard check for blockId
    
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

    // Re-run find immediately via effect or callback
    // Using setTimeout as a workaround for React state update timing
    setTimeout(() => {
        findMatches();
    }, 0);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0 || !document) return;

    const blockUpdates = new Map<string, string>();

    const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex);
    
    sortedMatches.forEach(match => {
        // Guard check: skip matches without blockId
        if (!match.blockId) return;
        
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
};

/**
 * Hook for block-based editor (backwards compatible with existing code)
 * Uses FindReplaceProvider context
 */
export function useFindReplaceContext() {
  const context = useContext(FindReplaceContext);
  if (!context) {
    throw new Error('useFindReplaceContext must be used within a FindReplaceProvider');
  }
  return context;
}

/**
 * Standalone editor-agnostic hook (new implementation)
 * Works with window.__SCRIBBLER_EDITOR_CONTENT__
 */
export function useFindReplace() {
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  /**
   * Get content from window fallback or return empty string
   */
  const getContent = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    return window.__SCRIBBLER_EDITOR_CONTENT__ || '';
  }, []);

  /**
   * Set content and dispatch change event
   */
  const setContent = useCallback((newContent: string) => {
    if (typeof window === 'undefined') return;
    window.__SCRIBBLER_EDITOR_CONTENT__ = newContent;
    
    // Dispatch custom event to notify listeners of content change
    const event = new CustomEvent('scribbler:content:changed', {
      detail: { content: newContent }
    });
    window.dispatchEvent(event);
  }, []);

  /**
   * Find all matches in the content
   */
  const findMatches = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const content = getContent();
    if (!findValue || !content) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const newMatches: Match[] = [];
    const flags = matchCase ? 'g' : 'gi';
    const pattern = wholeWord
      ? `\\b${findValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`
      : findValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const regex = new RegExp(pattern, flags);
    let match;

    while ((match = regex.exec(content)) !== null) {
      newMatches.push({
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        text: match[0],
      });
    }

    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);
  }, [findValue, matchCase, wholeWord, getContent]);

  /**
   * Navigate between matches
   */
  const navigateMatches = useCallback((direction: 'next' | 'prev') => {
    if (matches.length === 0) return;
    
    const nextIndex =
      direction === 'next'
        ? (currentMatchIndex + 1) % matches.length
        : (currentMatchIndex - 1 + matches.length) % matches.length;
    
    setCurrentMatchIndex(nextIndex);
  }, [matches, currentMatchIndex]);

  /**
   * Replace the current match
   */
  const handleReplace = useCallback(() => {
    if (currentMatchIndex === -1 || matches.length === 0) return;
    
    const content = getContent();
    if (!content) return;

    const match = matches[currentMatchIndex];
    const newContent =
      content.substring(0, match.startIndex) +
      replaceValue +
      content.substring(match.endIndex);

    setContent(newContent);
    
    // Re-run find immediately - setTimeout(0) ensures state update completes
    setTimeout(() => findMatches(), 0);
  }, [currentMatchIndex, matches, replaceValue, getContent, setContent, findMatches]);

  /**
   * Replace all matches
   */
  const handleReplaceAll = useCallback(() => {
    if (matches.length === 0) return;
    
    const content = getContent();
    if (!content) return;

    // Sort matches in reverse order to replace from end to start
    // This prevents index shifting issues
    const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex);
    
    let newContent = content;
    sortedMatches.forEach(match => {
      newContent =
        newContent.substring(0, match.startIndex) +
        replaceValue +
        newContent.substring(match.endIndex);
    });

    setContent(newContent);
    
    // Clear matches after replace all
    setMatches([]);
    setCurrentMatchIndex(-1);
  }, [matches, replaceValue, getContent, setContent]);

  /**
   * Clear all highlights and reset state
   */
  const clearHighlights = useCallback(() => {
    setMatches([]);
    setCurrentMatchIndex(-1);
  }, []);

  return {
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
}
