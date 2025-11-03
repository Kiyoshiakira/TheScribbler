'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Checkbox } from './ui/checkbox';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { useScript } from '@/context/script-context';
import type { ScriptBlock } from '@/lib/editor-types';

interface FindReplaceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Match {
  blockId: string;
  startIndex: number;
  endIndex: number;
}

export function FindReplaceDialog({ open, onOpenChange }: FindReplaceDialogProps) {
  const { document, setBlocks } = useScript();
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
      return;
    }

    const newMatches: Match[] = [];
    const flags = matchCase ? 'g' : 'gi';
    const regex = wholeWord
      ? new RegExp(`\\b${findValue}\\b`, flags)
      : new RegExp(findValue, flags);

    document.blocks.forEach(block => {
      let match;
      while ((match = regex.exec(block.text)) !== null) {
        newMatches.push({
          blockId: block.id,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
    });

    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);
  }, [findValue, document, matchCase, wholeWord]);

  useEffect(() => {
    if (open) {
      findMatches();
    } else {
      // Clear highlights when dialog is closed
      const activeElement = document.querySelector('[data-find-active="true"]');
      if (activeElement) {
        activeElement.removeAttribute('data-find-active');
      }
    }
  }, [findValue, open, matchCase, wholeWord, findMatches]);

  useEffect(() => {
    const activeMatch = matches[currentMatchIndex];
    document.querySelectorAll('[data-find-active="true"]').forEach(el => el.removeAttribute('data-find-active'));
    if (activeMatch) {
      const element = document.querySelector(`[data-block-id="${activeMatch.blockId}"]`);
      if (element) {
        element.setAttribute('data-find-active', 'true');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentMatchIndex, matches]);

  const navigateMatches = (direction: 'next' | 'prev') => {
    if (matches.length === 0) return;
    const nextIndex =
      direction === 'next'
        ? (currentMatchIndex + 1) % matches.length
        : (currentMatchIndex - 1 + matches.length) % matches.length;
    setCurrentMatchIndex(nextIndex);
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

    // After replacing, let's immediately find the next match in the updated content
    // This requires a slight delay for state to update
    setTimeout(() => {
      findMatches();
    }, 50);
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
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className='pr-8'>
          <DialogTitle className="font-headline">Find & Replace</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
            <div className="space-y-2">
                <Label htmlFor="find-input" className="sr-only">Find</Label>
                <Input
                  id="find-input"
                  placeholder="Find"
                  value={findValue}
                  onChange={(e) => setFindValue(e.target.value)}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="replace-input" className="sr-only">Replace</Label>
                <Input
                  id="replace-input"
                  placeholder="Replace with"
                  value={replaceValue}
                  onChange={(e) => setReplaceValue(e.target.value)}
                />
            </div>
            <Separator />
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="match-case" checked={matchCase} onCheckedChange={(c) => setMatchCase(c as boolean)} />
                        <Label htmlFor="match-case" className='text-muted-foreground'>Match case</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="whole-word" checked={wholeWord} onCheckedChange={(c) => setWholeWord(c as boolean)} />
                        <Label htmlFor="whole-word" className='text-muted-foreground'>Whole word</Label>
                    </div>
                </div>
                 <div className='text-sm text-muted-foreground'>
                   {findValue && matches.length > 0 ? `${currentMatchIndex + 1} of ${matches.length}` : 'No results'}
                </div>
            </div>
        </div>
        <DialogFooter className="sm:justify-between">
            <div className='flex gap-2'>
                <Button variant="outline" size="icon" disabled={matches.length === 0} onClick={() => navigateMatches('prev')}><ChevronUp className='w-4 h-4' /></Button>
                <Button variant="outline" size="icon" disabled={matches.length === 0} onClick={() => navigateMatches('next')}><ChevronDown className='w-4 h-4' /></Button>
            </div>
            <div className='flex gap-2'>
                 <Button variant="secondary" disabled={matches.length === 0} onClick={handleReplace}>Replace</Button>
                 <Button variant="secondary" disabled={matches.length === 0} onClick={handleReplaceAll}>Replace All</Button>
            </div>
        </DialogFooter>
         <button onClick={() => onOpenChange(false)} className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
