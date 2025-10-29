'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Film, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useScript } from '@/context/script-context';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

export type ScriptElement = 'scene-heading' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition';

export interface ScriptLine {
  id: string;
  type: ScriptElement;
  text: string;
}

const SCRIPT_ELEMENTS_CYCLE: ScriptElement[] = [
  'scene-heading',
  'action',
  'character',
  'dialogue',
  'parenthetical',
  'transition',
];

interface ScriptEditorProps {
  isStandalone: boolean;
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
  const ref = React.useRef<HTMLDivElement>(null);

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
    if (ref.current && ref.current.innerHTML !== line.text) {
      ref.current.innerHTML = line.text;
    }
  }, [line.text]);
  
  const getElementStyling = (type: ScriptElement, text: string) => {
    // Add min-height to empty lines to ensure they are visible and clickable
    if (!text.trim()) {
        return 'h-[1.5em]';
    }
    switch (type) {
        case 'scene-heading':
            return 'uppercase font-bold';
        case 'action':
            return ''; // Action should be left-aligned
        case 'character':
            return 'uppercase pl-[18rem]';
        case 'parenthetical':
            return 'pl-[14rem] text-muted-foreground';
        case 'dialogue':
            return 'pl-[10rem] pr-[10rem]';
        case 'transition':
            return 'uppercase text-right';
        default:
            return '';
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    // This is handled onBlur now
  };

  const handleBlur = (e: React.FormEvent<HTMLDivElement>) => {
    let newText = e.currentTarget.innerHTML;
    // Sanitize the text by removing trailing <br> and replacing &nbsp;
    newText = newText.replace(/<br\s*\/?>$/i, '').replace(/&nbsp;/g, ' ');
    if (line.text !== newText) {
      onTextChange(line.id, newText);
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
        'w-full outline-none focus:bg-primary/10 rounded-sm px-2 py-0.5 leading-relaxed',
        getElementStyling(line.type, line.text)
      )}
      dangerouslySetInnerHTML={{ __html: line.text }}
    />
  );
};

ScriptLineComponent.displayName = 'ScriptLineComponent';

export default function ScriptEditor({ 
  isStandalone = false
 }: ScriptEditorProps) {
  const { lines, setLines, isScriptLoading } = useScript();
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, lineId: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (lines.length > 0 && !activeLineId) {
      setActiveLineId(lines[0].id);
    }
  }, [lines, activeLineId]);

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
        let newText = line.text.replace(/<[^>]*>?/gm, ''); // Strip HTML tags
        
        // Changing TO parenthetical
        if (type === 'parenthetical' && !/^\(.*\)$/.test(newText.trim())) {
          newText = `(${newText})`;
        } 
        // Changing FROM parenthetical
        else if (line.type === 'parenthetical' && type !== 'parenthetical' && /^\(.*\)$/.test(newText.trim())) {
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
    } else if (e.key === 'Backspace' && (lines[currentIndex].text.replace(/<[^>]*>?/gm, '') === '' || lines[currentIndex].text === '<br>') && lines.length > 1) {
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
    window.open('/editor-standalone', '_blank', 'width=800,height=600');
    setContextMenu(null);
  };

  const formatElementName = (name: string) => {
    return name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  if (isScriptLoading) {
    return (
        <div className="h-full flex flex-col p-6 space-y-4">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-10 w-4/5" />
        </div>
    );
  }

  const editorContent = (
    <div 
        ref={editorRef} 
        className={cn(
            "flex-1 flex flex-col relative",
            isStandalone ? "bg-background p-4" : ""
        )}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => setContextMenu(null)}
      >
        <div className={cn(!isStandalone && "p-6 bg-card rounded-lg shadow-lg")}>
            <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="font-headline flex items-center gap-2 text-lg font-semibold">
                    <Film className="w-5 h-5 text-primary" />
                    <span className="truncate">SCENE 1: INT. COFFEE SHOP - DAY</span>
                </h2>
            </div>
            
            <DropdownMenu open={!!contextMenu} onOpenChange={() => setContextMenu(null)}>
                <DropdownMenuTrigger asChild>
                    <div 
                        style={{ 
                            position: 'fixed',
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
            className="flex-1 resize-none font-code text-base flex flex-col px-12"
            style={{ minHeight: '60vh' }}
            >
            {lines.map(line => (
                <div key={line.id} data-line-id={line.id} onClick={() => setActiveLineId(line.id)} className="py-1">
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
        </div>
    </div>
  );

  return editorContent;
}
