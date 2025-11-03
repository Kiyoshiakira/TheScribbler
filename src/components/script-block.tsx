
'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScriptBlock, ScriptBlockType } from '@/lib/editor-types';
import { useScript } from '@/context/script-context';

interface ScriptBlockProps {
  block: ScriptBlock;
  onChange: (blockId: string, newText: string) => void;
  isHighlighted: boolean;
}

const getBlockStyles = (type: ScriptBlockType): string => {
  switch (type) {
    case ScriptBlockType.SCENE_HEADING:
      return 'font-bold uppercase my-4';
    case ScriptBlockType.ACTION:
      return 'my-2';
    case ScriptBlockType.CHARACTER:
      return 'text-center uppercase mt-4 mb-1';
    case ScriptBlockType.PARENTHETICAL:
      return 'text-center text-sm my-1';
    case ScriptBlockType.DIALOGUE:
      return 'my-1 w-9/12 md:w-7/12 mx-auto';
    case ScriptBlockType.TRANSITION:
      return 'text-right uppercase mt-4 mb-2';
    default:
      return 'my-2';
  }
};

const ScriptBlockComponent: React.FC<ScriptBlockProps> = ({ block, onChange, isHighlighted }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { insertBlockAfter, cycleBlockType, mergeWithPreviousBlock } = useScript();

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
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const range = selection?.getRangeAt(0);

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertBlockAfter(block.id);
        return;
    }

    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      cycleBlockType(block.id);
    }

    if (e.key === 'Backspace') {
      if (selection && range && range.startOffset === 0 && range.endOffset === 0) {
        e.preventDefault();
        mergeWithPreviousBlock(block.id);
      }
    }
  };


  return (
    <div className={cn('relative group w-full', getBlockStyles(block.type))}>
        <div
            ref={elementRef}
            contentEditable
            suppressContentEditableWarning={true}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
                'w-full outline-none p-0.5 rounded-sm transition-colors whitespace-pre-wrap',
                'focus:bg-transparent dark:focus:bg-transparent',
                 isHighlighted ? 'bg-yellow-200 dark:bg-yellow-800' : 'focus:bg-muted/50'
            )}
            data-block-id={block.id}
            data-block-type={block.type}
            dangerouslySetInnerHTML={{ __html: block.text }}
        />
    </div>
  );
};

export default ScriptBlockComponent;
