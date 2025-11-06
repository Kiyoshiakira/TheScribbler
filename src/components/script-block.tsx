
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ScriptBlock, ScriptBlockType } from '@/lib/editor-types';
import { useScript } from '@/context/script-context';
import AiEditContextMenu from './ai-edit-context-menu';
import BlockInsertMenu from './block-insert-menu';

interface ScriptBlockProps {
  block: ScriptBlock;
  onChange: (blockId: string, newText: string) => void;
  isHighlighted: boolean;
  previousBlockType?: ScriptBlockType;
  nextBlockType?: ScriptBlockType;
}

// Dialogue block types for group detection
const DIALOGUE_TYPES: ScriptBlockType[] = [
  ScriptBlockType.CHARACTER, 
  ScriptBlockType.PARENTHETICAL, 
  ScriptBlockType.DIALOGUE
];

const getBlockStyles = (
  type: ScriptBlockType,
  previousBlockType?: ScriptBlockType,
  nextBlockType?: ScriptBlockType,
  isActive?: boolean
): string => {
  // Helper to check if a block is part of a dialogue group
  const isPartOfDialogueGroup = (
    currentType: ScriptBlockType,
    prevType?: ScriptBlockType,
    nextType?: ScriptBlockType
  ): boolean => {
    // Current block is in dialogue types
    if (!DIALOGUE_TYPES.includes(currentType)) return false;
    
    // Check if previous or next block is also a dialogue type
    return (
      (prevType !== undefined && DIALOGUE_TYPES.includes(prevType)) ||
      (nextType !== undefined && DIALOGUE_TYPES.includes(nextType))
    );
  };

  const inDialogueGroup = isPartOfDialogueGroup(type, previousBlockType, nextBlockType);
  const tightenSpacing = inDialogueGroup && !isActive;

  switch (type) {
    case ScriptBlockType.SCENE_HEADING:
      return 'font-bold uppercase my-6';
    case ScriptBlockType.ACTION:
      return 'my-4';
    case ScriptBlockType.CHARACTER:
      // Tighten top margin when part of dialogue group and not active
      if (tightenSpacing && previousBlockType === ScriptBlockType.DIALOGUE) {
        return 'text-center uppercase mt-2 mb-0 w-7/12 md:w-6/12 mx-auto';
      }
      // Use mb-1 when not in dialogue group to maintain spacing from following non-dialogue blocks
      return tightenSpacing ? 'text-center uppercase mt-4 mb-0 w-7/12 md:w-6/12 mx-auto' : 'text-center uppercase mt-4 mb-1 w-7/12 md:w-6/12 mx-auto';
    case ScriptBlockType.PARENTHETICAL:
      // Remove vertical margins when grouped and not active, make narrower
      return tightenSpacing ? 'text-center text-sm my-0 w-5/12 md:w-4/12 mx-auto' : 'text-center text-sm my-1 w-5/12 md:w-4/12 mx-auto';
    case ScriptBlockType.DIALOGUE:
      // Reduce top margin when following parenthetical or character
      if (tightenSpacing && (previousBlockType === ScriptBlockType.PARENTHETICAL || previousBlockType === ScriptBlockType.CHARACTER)) {
        return 'mt-0 mb-1 w-9/12 md:w-7/12 mx-auto';
      }
      return 'my-1 w-9/12 md:w-7/12 mx-auto';
    case ScriptBlockType.TRANSITION:
      return 'text-right uppercase mt-4 mb-2 w-full';
    case ScriptBlockType.SHOT:
      return 'uppercase my-3 w-full';
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

const ScriptBlockComponent: React.FC<ScriptBlockProps> = ({ 
  block, 
  onChange, 
  isHighlighted,
  previousBlockType,
  nextBlockType
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const blockWrapperRef = useRef<HTMLDivElement>(null);
  const { insertBlockAfter, cycleBlockType, mergeWithPreviousBlock, setActiveBlockId, activeBlockId, document: scriptDocument } = useScript();
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [aiMenuPosition, setAiMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [showInsertMenu, setShowInsertMenu] = useState(false);
  const [insertMenuPosition, setInsertMenuPosition] = useState({ x: 0, y: 0 });

  // Check if this block is currently active
  const isActive = activeBlockId === block.id;

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

  const handleWrapperContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only show insert menu if not clicking on the editable content itself
    if (e.target === blockWrapperRef.current) {
      e.preventDefault();
      setInsertMenuPosition({ x: e.clientX, y: e.clientY });
      setShowInsertMenu(true);
    }
  };

  const handleInsertBlock = (type: ScriptBlockType) => {
    insertBlockAfter(block.id, '', type);
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

    if (e.key === 'Tab') {
      e.preventDefault(); // Always prevent tab from leaving the editor
      if (!e.shiftKey) {
        cycleBlockType(block.id);
      }
      // Shift+Tab could cycle backwards in the future, for now just prevent default
      return;
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
    <div 
      ref={blockWrapperRef}
      className={cn('group w-full', getBlockStyles(block.type, previousBlockType, nextBlockType, isActive))}
      onContextMenu={handleWrapperContextMenu}
    >
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
        {showInsertMenu && (
          <BlockInsertMenu
            onInsertBlock={handleInsertBlock}
            onClose={() => setShowInsertMenu(false)}
            position={insertMenuPosition}
          />
        )}
    </div>
  );
};

export default ScriptBlockComponent;
