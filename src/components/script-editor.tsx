'use client';

import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Film, ExternalLink, Bot, Check, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScriptContext } from '@/context/script-context';
import { getAiProofreadSuggestions } from '@/app/actions';
import type { AiProofreadScriptOutput } from '@/ai/flows/ai-proofread-script';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';


export type ScriptElement = 'scene-heading' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition';

type CorrectionSuggestion = AiProofreadScriptOutput['suggestions'][0];

const SCRIPT_ELEMENTS_CYCLE: ScriptElement[] = [
  'scene-heading',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
];

interface ScriptLine {
  id: string;
  type: ScriptElement;
  text: string;
}

interface ScriptEditorProps {
  onActiveLineTypeChange?: (type: ScriptElement | null) => void;
  isStandalone?: boolean;
}

interface ScriptLineComponentProps {
  line: ScriptLine;
  onTextChange: (id: string, text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, id: string) => void;
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  isFocused: boolean;
}

const ScriptLineComponent = ({
  line,
  onTextChange,
  onKeyDown,
  isFocused,
  onContextMenu,
}: ScriptLineComponentProps) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused && ref.current) {
        ref.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        if (sel) {
            range.selectNodeContents(ref.current);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
  }, [isFocused]);

  useEffect(() => {
    // Only update the innerHTML if it's different from the line text.
    // This is crucial to prevent re-renders while typing.
    if (ref.current && ref.current.innerHTML !== line.text) {
      ref.current.innerHTML = line.text;
    }
  }, [line.text]);
  
  const getElementStyling = (type: ScriptElement) => {
    switch (type) {
      case 'scene-heading':
        return 'uppercase font-bold';
      case 'action':
        return '';
      case 'character':
        return 'uppercase text-center';
      case 'parenthetical':
        return 'text-center text-muted-foreground';
      case 'dialogue':
        return 'px-12';
      case 'transition':
        return 'uppercase text-right';
      default:
        return '';
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    // No need to call onTextChange here on every input, which was causing the issue.
    // The change is saved on blur.
  };

  const handleBlur = (e: React.FormEvent<HTMLDivElement>) => {
    // Update the parent state only when the user leaves the line.
    if (line.text !== e.currentTarget.innerHTML) {
      onTextChange(line.id, e.currentTarget.innerHTML);
    }
  };
  
  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={(e) => onKeyDown(e, line.id)}
      onInput={handleInput}
      onBlur={handleBlur}
      onContextMenu={(e) => onContextMenu(e, line.id)}
      className={cn(
        'w-full outline-none focus:bg-primary/10 rounded-sm px-2 py-1',
        getElementStyling(line.type)
      )}
      dangerouslySetInnerHTML={{ __html: line.text }}
    />
  );
};

ScriptLineComponent.displayName = 'ScriptLineComponent';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

export default function ScriptEditor({ onActiveLineTypeChange, isStandalone = false }: ScriptEditorProps) {
  const { scriptContent, setScriptContent } = useContext(ScriptContext);
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, lineId: string } | null>(null);

  const [suggestions, setSuggestions] = useState<CorrectionSuggestion[]>([]);
  const [isProofreading, setIsProofreading] = useState(false);
  const [isSuggestionsDialogOpen, setIsSuggestionsDialogOpen] = useState(false);
  const { toast } = useToast();

  const debouncedScriptContent = useDebounce(scriptContent, 2000);

  const runProofread = useCallback(async () => {
    setIsProofreading(true);
    const result = await getAiProofreadSuggestions({ script: debouncedScriptContent });
    setIsProofreading(false);

    if (result.error) {
        toast({
            variant: 'destructive',
            title: 'Proofreading Error',
            description: result.error,
        });
        setSuggestions([]);
    } else if (result.data) {
        setSuggestions(result.data.suggestions);
    }
  }, [debouncedScriptContent, toast]);

  useEffect(() => {
    if (debouncedScriptContent && !isStandalone) {
      runProofread();
    }
  }, [debouncedScriptContent, isStandalone, runProofread]);


  useEffect(() => {
    const parsedLines = scriptContent.split('\n').map((text, index) => {
      // Basic logic to infer type from text, can be improved.
      if (text.startsWith('INT.') || text.startsWith('EXT.')) return { id: `line-${index}-${Date.now()}`, type: 'scene-heading' as ScriptElement, text };
      if (text.trim().startsWith('(') && text.trim().endsWith(')')) return { id: `line-${index}-${Date.now()}`, type: 'parenthetical' as ScriptElement, text };
      if (text.trim().endsWith(' TO:')) return { id: `line-${index}-${Date.now()}`, type: 'transition' as ScriptElement, text };
      if (/^[A-Z\s]+$/.test(text) && text.length > 0 && text.length < 30) return { id: `line-${index}-${Date.now()}`, type: 'character' as ScriptElement, text };
      return { id: `line-${index}-${Date.now()}`, type: 'action' as ScriptElement, text };
    });
    setLines(parsedLines);
    if (parsedLines.length > 0 && !activeLineId) {
      setActiveLineId(parsedLines[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const newScriptContent = lines.map(line => line.text.replace(/<br>/g, '')).join('\n');
    setScriptContent(newScriptContent);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newScriptContent.replace(/<br>/g, '\n');
    const textOnly = tempDiv.textContent || tempDiv.innerText || '';
    const words = textOnly.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    setWordCount(count);
    
    const minutes = Math.round((count / 160) * 10) / 10;
    setEstimatedMinutes(minutes);
  }, [lines, setScriptContent]);

  useEffect(() => {
    if (onActiveLineTypeChange && activeLineId) {
      const activeLine = lines.find(line => line.id === activeLineId);
      onActiveLineTypeChange(activeLine ? activeLine.type : null);
    }
  }, [activeLineId, lines, onActiveLineTypeChange]);

  const handleTextChange = (id: string, text: string) => {
    setLines(prevLines => {
      const newLines = [...prevLines];
      const index = newLines.findIndex(line => line.id === id);
      if (index !== -1) {
        newLines[index] = { ...newLines[index], text };
      }
      return newLines;
    });
  };

  const handleTypeChange = (id: string, type: ScriptElement) => {
    setLines(prevLines => prevLines.map(line => {
      if (line.id === id) {
        let newText = line.text.replace(/<[^>]*>?/gm, '');
        // Add parenthesis for parenthetical
        if (type === 'parenthetical' && !/^\(.*\)$/.test(newText)) {
          newText = `(${newText})`;
        } else if (line.type === 'parenthetical' && type !== 'parenthetical' && /^\(.*\)$/.test(newText)) {
          // Remove parenthesis when changing from parenthetical
          newText = newText.substring(1, newText.length - 1);
        }
        return { ...line, type, text: newText };
      }
      return line;
    }));
    setActiveLineId(id);
    setContextMenu(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, id: string) => {
    const currentIndex = lines.findIndex(line => line.id === id);

    if (e.key === 'Tab') {
      e.preventDefault();
      const currentType = lines[currentIndex].type;
      const currentTypeIndex = SCRIPT_ELEMENTS_CYCLE.indexOf(currentType);
      const nextType = SCRIPT_ELEMENTS_CYCLE[(currentTypeIndex + 1) % SCRIPT_ELEMENTS_CYCLE.length];
      handleTypeChange(id, nextType);
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const currentLine = lines[currentIndex];
        const selection = window.getSelection();
        let beforeEnter = currentLine.text;
        let afterEnter = '';

        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.startContainer;
            
            // Create a temporary div to measure the split point accurately
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = currentLine.text;

            const preCaretRange = document.createRange();
            preCaretRange.selectNodeContents(tempDiv);
            
            const endContainer = (container.nodeType === Node.TEXT_NODE) ? container : tempDiv.childNodes[range.endOffset];
            preCaretRange.setEnd(endContainer, range.endOffset);

            beforeEnter = preCaretRange.toString();
            afterEnter = currentLine.text.substring(beforeEnter.length).replace(/^<br>/, '');
        }

        const newLines = [...lines];
        newLines[currentIndex] = { ...currentLine, text: beforeEnter };
        
        let nextType: ScriptElement = 'action';
        const currentType = currentLine.type;
        if (currentType === 'scene-heading') nextType = 'action';
        if (currentType === 'character') nextType = 'dialogue';
        if (currentType === 'dialogue') nextType = 'character';
        if (currentType === 'transition') nextType = 'scene-heading';

        const newLine: ScriptLine = { id: `line-${Date.now()}`, type: nextType, text: afterEnter };
        newLines.splice(currentIndex + 1, 0, newLine);
        
        setLines(newLines);

        setTimeout(() => {
            setActiveLineId(newLine.id);
        }, 0)

    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentIndex > 0) {
            setActiveLineId(lines[currentIndex - 1].id);
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentIndex < lines.length - 1) {
            setActiveLineId(lines[currentIndex + 1].id);
        }
    } else if (e.key === 'Backspace' && lines[currentIndex].text.replace(/<[^>]*>?/gm, '') === '' && lines.length > 1) {
        e.preventDefault();
        if (currentIndex === 0) return;
        const prevLine = lines[currentIndex - 1];
        if (!prevLine) return;
        
        const newLines = lines.filter(line => line.id !== id);
        setLines(newLines);

        setTimeout(() => {
            setActiveLineId(prevLine.id);
        }, 0);
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>, lineId: string) => {
    e.preventDefault();
    setActiveLineId(lineId);
    setContextMenu({ x: e.clientX, y: e.clientY, lineId });
  }
  
  const handlePopOut = () => {
    window.open('/editor', '_blank', 'width=800,height=600');
    setContextMenu(null);
  };

  const applySuggestion = (suggestion: CorrectionSuggestion) => {
    const { originalText, correctedText } = suggestion;
    // This is a simple implementation. A more robust solution would use a diffing library.
    const newScriptContent = scriptContent.replace(originalText, correctedText);
    setScriptContent(newScriptContent);
    // Remove the applied suggestion from the list
    setSuggestions(prev => prev.filter(s => s !== suggestion));
    toast({
        title: 'Suggestion Applied',
        description: 'The correction has been made in the script.',
    });
  };

  const dismissSuggestion = (suggestion: CorrectionSuggestion) => {
    setSuggestions(prev => prev.filter(s => s !== suggestion));
  };


  const formatElementName = (name: string) => {
    return name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  const editorContent = (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline flex items-center gap-2 text-lg">
            <Film className="w-5 h-5 text-primary" />
            <span>SCENE 1: INT. COFFEE SHOP - DAY</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent 
        ref={editorRef} 
        className="flex-1 flex relative"
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => setContextMenu(null)}
      >
        <DropdownMenu open={!!contextMenu} onOpenChange={() => setContextMenu(null)}>
            <DropdownMenuTrigger asChild>
                <div 
                    style={{ 
                        position: 'fixed', // Use fixed to position relative to viewport
                        left: contextMenu ? contextMenu.x : 0, 
                        top: contextMenu ? contextMenu.y : 0,
                    }}
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
                {SCRIPT_ELEMENTS_CYCLE.map(element => (
                    <DropdownMenuItem 
                        key={element} 
                        onClick={() => contextMenu && handleTypeChange(contextMenu.lineId, element)}
                    >
                        {formatElementName(element)}
                    </DropdownMenuItem>
                ))}
                {!isStandalone && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handlePopOut}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        <span>Pop-out Editor</span>
                    </DropdownMenuItem>
                  </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>

        <div
          className="flex-1 resize-none font-code text-base leading-relaxed bg-card flex flex-col gap-2"
          style={{ minHeight: '60vh' }}
        >
          {lines.map(line => (
              <div key={line.id} data-line-id={line.id} onClick={() => setActiveLineId(line.id)}>
                <ScriptLineComponent
                    line={line}
                    onTextChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    onContextMenu={handleContextMenu}
                    isFocused={line.id === activeLineId}
                />
              </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground justify-between gap-6">
        <div className='flex items-center gap-2'>
            {!isStandalone && (
              <Button 
                variant="ghost" 
                size="sm" 
                className='h-auto px-2 py-1'
                onClick={() => setIsSuggestionsDialogOpen(true)}
                disabled={isProofreading || suggestions.length === 0}
              >
                  <Bot className="w-4 h-4 mr-2" />
                  Proofreader
                  {isProofreading ? (
                    <Skeleton className='w-4 h-4 rounded-full ml-2' />
                  ) : (
                    suggestions.length > 0 && <Badge variant="default" className="ml-2">{suggestions.length}</Badge>
                  )}
              </Button>
            )}
        </div>
        <div className='flex items-center gap-6'>
            <span>{wordCount} words</span>
            <div className="flex items-center gap-2">
                <Clock className='w-4 h-4' />
                <span>Approx. {estimatedMinutes} min</span>
            </div>
        </div>
      </CardFooter>

      <Dialog open={isSuggestionsDialogOpen} onOpenChange={setIsSuggestionsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center gap-2"><Sparkles className='w-5 h-5 text-primary' /> AI Proofreader Suggestions</DialogTitle>
            <DialogDescription>
              Review the suggestions below. You can apply or dismiss each correction.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] -mx-6 px-6">
            <div className="space-y-4 py-4">
              {suggestions.map((suggestion, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="bg-muted/50 p-4">
                    <CardTitle className="text-sm font-semibold">{suggestion.explanation}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 text-sm">
                    <p className="text-red-500 line-through mb-2">"{suggestion.originalText}"</p>
                    <p className="text-green-600">"{suggestion.correctedText}"</p>
                  </CardContent>
                  <CardFooter className="bg-muted/50 p-2 flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => dismissSuggestion(suggestion)}>
                      <X className="w-4 h-4 mr-2" />
                      Dismiss
                    </Button>
                    <Button size="sm" onClick={() => applySuggestion(suggestion)}>
                      <Check className="w-4 h-4 mr-2" />
                      Apply
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );

  if (isStandalone) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col p-4">
        {editorContent}
      </div>
    );
  }

  return (
    <Card className="h-full flex flex-col shadow-lg">
      {editorContent}
    </Card>
  );
}
