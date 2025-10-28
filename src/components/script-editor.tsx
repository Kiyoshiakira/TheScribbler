'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

type ScriptElement = 'scene-heading' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition';

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
  scriptContent: string;
  setScriptContent: (content: string) => void;
}

const ScriptLineComponent = ({
  line,
  onTextChange,
  onKeyDown,
  isFocused,
}: {
  line: ScriptLine;
  onTextChange: (id: string, text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, id: string) => void;
  isFocused: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isFocused && ref.current) {
      ref.current.focus();
      // Move cursor to the end
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

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onKeyDown={(e) => onKeyDown(e, line.id)}
      onInput={(e) => onTextChange(line.id, e.currentTarget.textContent || '')}
      onBlur={(e) => onTextChange(line.id, e.currentTarget.textContent || '')}
      className={cn(
        'w-full outline-none focus:bg-primary/10 rounded-sm px-2 py-1',
        getElementStyling(line.type)
      )}
      dangerouslySetInnerHTML={{ __html: line.text }}
    />
  );
};

export default function ScriptEditor({ scriptContent, setScriptContent }: ScriptEditorProps) {
  const [lines, setLines] = useState<ScriptLine[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [popup, setPopup] = useState<{ visible: boolean, text: string, top: number, left: number }>({ visible: false, text: '', top: 0, left: 0 });
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsedLines = scriptContent.split('\n').map((text, index) => ({
      id: `line-${index}-${Date.now()}`,
      type: 'action' as ScriptElement, // Simple default
      text: text,
    }));
    setLines(parsedLines);
    if (parsedLines.length > 0) {
      setActiveLineId(parsedLines[0].id);
    }
  }, []);

  useEffect(() => {
    const newScriptContent = lines.map(line => line.text).join('\n');
    setScriptContent(newScriptContent);

    const words = newScriptContent.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    setWordCount(count);
    
    const minutes = Math.round((count / 160) * 10) / 10;
    setEstimatedMinutes(minutes);
  }, [lines, setScriptContent]);

  const handleTextChange = (id: string, text: string) => {
    setLines(prevLines => prevLines.map(line => (line.id === id ? { ...line, text } : line)));
  };

  const showPopup = (type: ScriptElement) => {
      if(editorRef.current) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();

        const top = rect.top - editorRect.top - 28; // Position above the cursor with an offset
        const left = rect.left - editorRect.left;

        setPopup({ visible: true, text: type.replace('-', ' ').toUpperCase(), top, left });

        setTimeout(() => setPopup(p => ({...p, visible: false, top: 0, left: 0})), 1500);
      }
  };

  const handleTypeChange = (id: string, type: ScriptElement) => {
    setLines(prevLines => prevLines.map(line => {
      if (line.id === id) {
        showPopup(type);
        return { ...line, type };
      }
      return line;
    }));
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
        const text = currentLine.text;
        const selection = window.getSelection();
        let beforeEnter = text;
        let afterEnter = '';

        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const caretPos = range.startOffset;
            beforeEnter = text.substring(0, caretPos);
            afterEnter = text.substring(caretPos);
        }

        const newLines = [...lines];
        newLines[currentIndex] = { ...currentLine, text: beforeEnter };
        
        const newLine: ScriptLine = { id: `line-${Date.now()}`, type: 'action', text: afterEnter };
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
    } else if (e.key === 'Backspace' && lines[currentIndex].text === '') {
        e.preventDefault();
        if(lines.length > 1) {
            const newLines = lines.filter(line => line.id !== id);
            setLines(newLines);
            if (currentIndex > 0) {
              setActiveLineId(lines[currentIndex - 1].id);
            } else if (newLines.length > 0) {
              setActiveLineId(newLines[0].id);
            } else {
              setActiveLineId(null);
            }
        }
    }
  };
  
  return (
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-headline flex items-center gap-2 text-lg">
            <Film className="w-5 h-5 text-primary" />
            <span>SCENE 1: INT. COFFEE SHOP - DAY</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent ref={editorRef} className="flex-1 flex relative">
        <div
          className="flex-1 resize-none font-code text-base leading-relaxed bg-card flex flex-col gap-2"
          style={{ minHeight: '60vh' }}
          onClick={(e) => {
              const target = e.target as HTMLElement;
              const lineEl = target.closest('[data-line-id]');
              if (lineEl) {
                  setActiveLineId(lineEl.getAttribute('data-line-id'));
              }
          }}
        >
          {lines.map(line => (
              <div key={line.id} data-line-id={line.id}>
                <ScriptLineComponent
                    line={line}
                    onTextChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    isFocused={line.id === activeLineId}
                />
              </div>
          ))}
        </div>
         {popup.visible && (
            <div 
                className="absolute bg-foreground text-background text-xs font-bold py-1 px-2 rounded-md shadow-lg pointer-events-none"
                style={{ top: `${popup.top}px`, left: `${popup.left}px` }}
            >
                {popup.text}
            </div>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground justify-end gap-6">
        <span>{wordCount} words</span>
        <div className="flex items-center gap-2">
            <Clock className='w-4 h-4' />
            <span>Approx. {estimatedMinutes} min</span>
        </div>
      </CardFooter>
    </Card>
  );
}
