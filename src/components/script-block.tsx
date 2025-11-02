'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScriptBlock, ScriptBlockType } from '@/lib/editor-types';

interface ScriptBlockProps {
  block: ScriptBlock;
  onChange: (blockId: string, newText: string) => void;
}

const getBlockStyles = (type: ScriptBlockType): string => {
  switch (type) {
    case ScriptBlockType.SCENE_HEADING:
      return 'font-bold uppercase my-6';
    case ScriptBlockType.ACTION:
      return 'my-4';
    case ScriptBlockType.CHARACTER:
      return 'font-bold text-center my-4 uppercase';
    case ScriptBlockType.PARENTHETICAL:
      return 'text-center text-sm text-muted-foreground my-2';
    case ScriptBlockType.DIALOGUE:
      return 'my-4 mx-16';
    case ScriptBlockType.TRANSITION:
      return 'font-bold text-right my-4 uppercase';
    default:
      return '';
  }
};

const ScriptBlockComponent: React.FC<ScriptBlockProps> = ({ block, onChange }) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (element && element.innerText !== block.text) {
      element.innerText = block.text;
    }
  }, [block.text]);

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.innerText;
    if (newText !== block.text) {
      onChange(block.id, newText);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // For now, we only prevent the default 'Enter' behavior to avoid creating new divs.
    // More complex logic for creating new blocks will be added later.
    if (e.key === 'Enter') {
      e.preventDefault();
      // Future logic: create a new block below
    }
  };

  return (
    <div
      ref={elementRef}
      contentEditable
      suppressContentEditableWarning={true}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={cn(
        'w-full outline-none focus:bg-muted/50 p-1 rounded-sm transition-colors',
        getBlockStyles(block.type)
      )}
      data-block-id={block.id}
      data-block-type={block.type}
    />
  );
};

export default ScriptBlockComponent;
