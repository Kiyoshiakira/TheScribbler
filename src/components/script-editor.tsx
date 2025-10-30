'use client';

import React from 'react';
import { useScript } from '@/context/script-context';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

export type ScriptElement = 'scene-heading' | 'action' | 'character' | 'parenthetical' | 'dialogue' | 'transition';

export interface ScriptLine {
  id: string;
  type: ScriptElement;
  text: string;
}

interface ScriptEditorProps {
  isStandalone?: boolean;
}

export default function ScriptEditor({ isStandalone = false }: ScriptEditorProps) {
  const { script, setLines, isScriptLoading } = useScript();

  if (isScriptLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-6 w-1/2" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative h-full w-full font-code',
        isStandalone ? 'p-4' : 'p-8' // Add more padding for a doc-like feel
      )}
    >
      <Textarea
        value={script?.content || ''}
        onChange={(e) => setLines(e.target.value)}
        className="h-full w-full resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed"
        placeholder="A new story begins..."
      />
    </div>
  );
}
