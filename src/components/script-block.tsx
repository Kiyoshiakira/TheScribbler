'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ScriptBlock, ScriptBlockType } from '@/lib/editor-types';
import { Button } from './ui/button';
import { Scissors } from 'lucide-react';
import { useScript } from '@/context/script-context';

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
      return 'text-center uppercase my-4 w-full';
    case ScriptBlockType.PARENTHETICAL:
      return 'text-center text-sm text-muted-foreground my-2 w-1/2 mx-auto';
    case ScriptBlockType.DIALOGUE:
      return 'my-4 w-10/12 md:w-8/12 mx-auto';
    case ScriptBlockType.TRANSITION:
      return 'text-right uppercase my-4 w-full';
    default:
      return '';
  }
};

const ScriptBlockComponent: React.FC<ScriptBlockProps> = ({ block, onChange, isHighlighted }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const { splitScene } = useScript();

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
    // For now, we only prevent the default 'Enter' behavior to avoid creating new divs.
    // More complex logic for creating new blocks will be added later.
    if (e.key === 'Enter') {
      e.preventDefault();
      // Future logic: create a new block below
    }
  };

  const isSceneHeading = block.type === ScriptBlockType.SCENE_HEADING;

  return (
    <div className={cn('relative group', getBlockStyles(block.type))}>
        <div
            ref={elementRef}
            contentEditable
            suppressContentEditableWarning={true}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
                'w-full outline-none focus:bg-muted/50 p-1 rounded-sm transition-colors',
                isHighlighted && 'bg-yellow-200 dark:bg-yellow-800'
            )}
            data-block-id={block.id}
            data-block-type={block.type}
        />
        {isSceneHeading && (
             <Button
                variant="ghost"
                size="icon"
                className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => splitScene(block.id)}
                aria-label="Split scene"
            >
                <Scissors className="h-4 w-4" />
            </Button>
        )}
    </div>
  );
};

export default ScriptBlockComponent;
