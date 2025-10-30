'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

interface ScriptLineComponentProps {
  line: ScriptLine;
  onTextChange: (id: string, text: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, id: string) => void;
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
  isFocused: boolean;
}

const getElementStyling = (type: ScriptElement | undefined | null) => {
    switch (type) {
        case 'scene-heading':
        return 'pl-6 font-bold uppercase';
        case 'action':
        return 'pl-6';
        case 'character':
        return 'pl-32 uppercase';
        case 'parenthetical':
        return 'pl-28';
        case 'dialogue':
        return 'pl-20';
        case 'transition':
        return 'text-right pr-6 uppercase';
        default:
        // Fallback to 'action' style for any unknown or undefined type
        return 'pl-6';
    }
};

class ScriptLineComponent extends React.Component<ScriptLineComponentProps> {
  private el = React.createRef<HTMLDivElement>();

  shouldComponentUpdate(nextProps: ScriptLineComponentProps) {
    // Only re-render if the line type changes, it gains/loses focus,
    // or if the text is changed externally (not by the user typing in this component).
    if (
      nextProps.line.type !== this.props.line.type ||
      nextProps.isFocused !== this.props.isFocused ||
      this.el.current?.innerHTML !== nextProps.line.text
    ) {
      return true;
    }
    return false;
  }
  
  componentDidMount() {
      this.focusAndMoveCursorToEnd();
  }

  componentDidUpdate(prevProps: ScriptLineComponentProps) {
    if (this.props.isFocused && !prevProps.isFocused) {
       this.focusAndMoveCursorToEnd();
    }
  }
  
  focusAndMoveCursorToEnd = () => {
    if (this.props.isFocused && this.el.current) {
        this.el.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        if (sel) {
            range.selectNodeContents(this.el.current);
            range.collapse(false); // false for end, true for start
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
  };

  handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.innerHTML;
    // We update parent state on input, but don't trigger a re-render from here
    // This allows typing to be smooth.
    if (this.props.line.text !== newText) {
        this.props.onTextChange(this.props.line.id, newText);
    }
  };

  handleBlur = (e: React.FormEvent<HTMLDivElement>) => {
    let newText = e.currentTarget.innerHTML;
    // Sanitize the text by removing trailing <br> and replacing &nbsp;
    newText = newText.replace(/<br\s*\/?>$/i, '').replace(/&nbsp;/g, ' ');
    if (this.props.line.text !== newText) {
      this.props.onTextChange(this.props.line.id, newText);
    }
  };

  render() {
    const { line, onKeyDown, onContextMenu } = this.props;

    return (
      <div
        ref={this.el}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={(e) => onKeyDown(e, line.id)}
        onInput={this.handleInput}
        onBlur={this.handleBlur}
        onContextMenu={(e) => onContextMenu(e, line.id)}
        className={cn(
          'outline-none rounded-sm py-0.5 min-h-[1.5em]',
          getElementStyling(line.type)
        )}
        dangerouslySetInnerHTML={{ __html: line.text }}
      ></div>
    );
  }
}

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

  const handleTextChange = useCallback((id: string, text: string) => {
    setLines(prevLines => {
      const newLines = [...prevLines];
      const index = newLines.findIndex(line => line.id === id);
      if (index !== -1) {
        newLines[index] = { ...newLines[index], text };
      }
      return newLines;
    });
  }, [setLines]);

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

        let beforeEnter = '';
        let afterEnter = '';

        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const lineElement = e.currentTarget;

            const preCaretRange = document.createRange();
            preCaretRange.selectNodeContents(lineElement);
            preCaretRange.setEnd(range.startContainer, range.startOffset);
            
            const tempDiv = document.createElement('div');
            tempDiv.appendChild(preCaretRange.cloneContents());
            beforeEnter = tempDiv.innerHTML;

            const postCaretRange = document.createRange();
            postCaretRange.selectNodeContents(lineElement);
            postCaretRange.setStart(range.endContainer, range.endOffset);

            const tempDiv2 = document.createElement('div');
            tempDiv2.appendChild(postCaretRange.cloneContents());
            afterEnter = tempDiv2.innerHTML;
        } else {
            beforeEnter = currentLine.text;
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

  return (
    <div
        ref={editorRef}
        className={cn(
            "relative font-code text-sm leading-relaxed",
            isStandalone ? "bg-background p-4 flex-1" : ""
        )}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => setContextMenu(null)}
      >
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
            className="space-y-1"
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
    </div>
  );

}
