'use client';

import { useState, useCallback, useContext, useEffect } from 'react';
import { useScript } from '@/context/script-context';

export interface Match {
  blockId: string;
  blockIndex: number;
  startIndex: number;
  endIndex: number;
}

export function useFindReplace() {
  const { document, setBlocks, activeMatch, setActiveMatch } = useScript();
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const findMatches = useCallback(() => {
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

    // This is tricky because the state update is async.
    // Let's refind matches after a short delay to let the document update.
    setTimeout(() => {
        findMatches();
    }, 100);
  };

  const handleReplaceAll = () => {
    if (matches.length === 0 || !document) return;

    const blockUpdates = new Map<string, string>();

    // We process replacements from the end to the start to not mess up indices
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
