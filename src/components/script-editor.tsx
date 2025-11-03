'use client';

import React from 'react';
import { useScript } from '@/context/script-context';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import ScriptBlockComponent from './script-block';
import type { ScriptBlock } from '@/lib/editor-types';

interface ScriptEditorProps {
  isStandalone?: boolean;
}

export default function ScriptEditor({ isStandalone = false }: ScriptEditorProps) {
  const { document, setBlocks, isScriptLoading, activeMatch } = useScript();

  const handleBlockChange = (blockId: string, newText: string) => {
    if (document) {
      const newBlocks = document.blocks.map(block =>
        block.id === blockId ? { ...block, text: newText } : block
      );
      setBlocks(newBlocks);
    }
  };

  if (isScriptLoading || !document) {
    return (
      <div className="p-8 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-6 w-1/4 mx-auto" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative h-full w-full font-code max-w-3xl mx-auto',
        isStandalone ? 'p-4' : 'p-8 md:p-16' // Add more padding for a doc-like feel
      )}
    >
      {document.blocks.map((block, index) => (
        <ScriptBlockComponent
          key={block.id}
          block={block}
          onChange={handleBlockChange}
          isHighlighted={activeMatch?.blockIndex === index}
        />
      ))}
    </div>
  );
}
