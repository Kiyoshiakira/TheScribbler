
'use client';

import React from 'react';
import { useScript } from '@/context/script-context';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import ScriptBlockComponent from './script-block';
import type { ScriptBlock } from '@/lib/editor-types';
import { ScriptBlockType } from '@/lib/editor-types';

interface SceneHeaderCardProps {
    sceneNumber: number;
    setting: string;
    description: string;
}

const SceneHeaderCard: React.FC<SceneHeaderCardProps> = ({ sceneNumber, setting, description }) => {
    return (
        <div className="bg-primary/10 border-l-4 border-primary text-primary-foreground p-4 rounded-r-lg my-8 not-prose">
            <h3 className="font-bold font-headline text-lg text-primary">SCENE {sceneNumber}: {setting}</h3>
            <p className="text-sm text-primary/80 mt-1">{description}</p>
        </div>
    );
};


interface ScriptEditorProps {
  isStandalone?: boolean;
}

export default function ScriptEditor({ isStandalone = false }: ScriptEditorProps) {
  const { document, setBlocks, isScriptLoading, activeMatch, scenes } = useScript();

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

  let sceneCounter = 0;

  return (
    <div
      className={cn(
        'relative h-full w-full font-code max-w-3xl mx-auto',
        isStandalone ? 'p-4' : 'p-8 md:p-12 bg-card shadow-sm rounded-lg border'
      )}
    >
      {document.blocks.map((block, index) => {
        let sceneHeaderCard = null;
        if (block.type === ScriptBlockType.SCENE_HEADING) {
            sceneCounter++;
            const sceneData = scenes?.find(s => s.sceneNumber === sceneCounter);
            if (sceneData) {
                 sceneHeaderCard = (
                    <SceneHeaderCard
                        sceneNumber={sceneData.sceneNumber}
                        setting={sceneData.setting}
                        description={sceneData.description}
                    />
                );
            }
        }
        
        return (
             <React.Fragment key={block.id}>
                {sceneHeaderCard}
                <ScriptBlockComponent
                    block={block}
                    onChange={handleBlockChange}
                    isHighlighted={activeMatch?.blockIndex === index}
                />
            </React.Fragment>
        )
      })}
    </div>
  );
}
