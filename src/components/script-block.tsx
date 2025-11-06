
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScriptBlock, ScriptBlockType } from '@/lib/editor-types';
import { useScript } from '@/context/script-context';
import AiEditContextMenu from './ai-edit-context-menu';

interface ScriptBlockProps {
  block: ScriptBlock;
  onChange: (blockId: string, newText: string) => void;
  isHighlighted: boolean;
}

const getBlockStyles = (type: ScriptBlockType): string => {
  switch (type) {
    case ScriptBlockType.SCENE_HEADING:
      return 'font-bold uppercase my-6';
    case ScriptBlockType.ACTION:
      return 'my-4';
    case ScriptBlockType.CHARACTER:
      return 'text-center uppercase mt-4 mb-1';
    case ScriptBlockType.PARENTHETICAL:
      return 'text-center text-sm my-1';
    case ScriptBlockType.DIALOGUE:
      return 'my-1 w-9/12 md:w-7/12 mx-auto';
    case ScriptBlockType.TRANSITION:
      return 'text-right uppercase mt-4 mb-2';
    case ScriptBlockType.CENTERED:
      return 'text-center my-4 font-medium';
    case ScriptBlockType.SECTION:
      return 'font-bold text-lg mt-8 mb-4 text-primary';
    case ScriptBlockType.SYNOPSIS:
      return 'italic text-muted-foreground my-2 text-sm border-l-2 border-muted pl-4';
    default:
      return 'my-2';
  }
};

const ScriptBlockComponent: React.FC<ScriptBlockProps> = ({ block, onChange, isHighlighted }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { insertBlockAfter, cycleBlockType, mergeWithPreviousBlock, setActiveBlockId, document: scriptDocument } = useScript();
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [aiMenuPosition, setAiMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');

  useEffect(() => {
    const element = elementRef.current;
    if (element && element.innerText !== block.text) {
      element.innerText = block.text;
    }
  }, [block.text]);

  useEffect(() => {
    const element = elementRef.current;
    if (element && isHighlighted) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isHighlighted]);


  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.innerText;
    if (newText !== block.text) {
      onChange(block.id, newText);
    }
    setActiveBlockId(null);
  };
  
  const handleFocus = () => {
    setActiveBlockId(block.id);
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 0) {
      e.preventDefault();
      setSelectedText(text);
      setAiMenuPosition({ x: e.clientX, y: e.clientY });
      setShowAiMenu(true);
    }
  };

  const handleApplyEdit = (originalText: string, editedText: string) => {
    const currentText = elementRef.current?.innerText || block.text;
    const newText = currentText.replace(originalText, editedText);
    
    if (elementRef.current) {
      elementRef.current.innerText = newText;
    }
    onChange(block.id, newText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    const element = e.currentTarget;

    if (e.key === 'Enter') {
      if(e.shiftKey) {
        // Allow default behavior (new line) for Shift+Enter
        return;
      }
      e.preventDefault();
      insertBlockAfter(block.id);
      return;
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      cycleBlockType(block.id);
    }
    
    if (e.key === 'Backspace' && range.startOffset === 0 && range.endOffset === 0) {
      const currentText = element.innerText;
       if (currentText === '' || selection.toString() === currentText) {
          e.preventDefault();
          mergeWithPreviousBlock(block.id);
      }
    }
    
    // Arrow key navigation between blocks
    const focusSibling = (sibling: 'previous' | 'next') => {
        const siblingElement = (element.parentElement?.[`${sibling}ElementSibling`] as HTMLElement)?.querySelector('[contenteditable="true"]') as HTMLElement;
        if (siblingElement) {
            e.preventDefault();
            siblingElement.focus();
            // Move cursor to the end if moving up, or start if moving down
            const newRange = document.createRange();
            const selection = window.getSelection();
            newRange.selectNodeContents(siblingElement);
            newRange.collapse(sibling === 'previous'); // true = to end, false = to start
            selection?.removeAllRanges();
            selection?.addRange(newRange);
        }
    }

    if (e.key === 'ArrowUp') {
        const atStart = range.startOffset === 0 && range.startContainer === element.firstChild;
        if (atStart) {
           focusSibling('previous');
        }
    }

    if (e.key === 'ArrowDown') {
        const atEnd = range.endOffset === element.innerText.length && range.endContainer === element.lastChild;
        if (atEnd) {
           focusSibling('next');
        }
    }

  };


  return (
    <div className={cn('group w-full', getBlockStyles(block.type))}>
        <div
            ref={elementRef}
            contentEditable
            suppressContentEditableWarning={true}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onContextMenu={handleContextMenu}
            className={cn(
                'w-full outline-none p-2 rounded-sm transition-colors whitespace-pre-wrap min-h-[1.5rem] focus:ring-1 focus:ring-primary cursor-text',
                'focus:bg-muted/50',
                 isHighlighted ? 'bg-yellow-200 dark:bg-yellow-800' : 'hover:bg-muted/30'
            )}
            data-block-id={block.id}
            data-block-type={block.type}
        />
        {showAiMenu && scriptDocument && (
          <AiEditContextMenu
            selectedText={selectedText}
            context={scriptDocument.blocks}
            onApplyEdit={handleApplyEdit}
            onClose={() => setShowAiMenu(false)}
            position={aiMenuPosition}
          />
        )}
    </div>
  );
};

export default ScriptBlockComponent;
