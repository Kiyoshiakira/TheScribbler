'use client';

import React, { useState } from 'react';
import { useScript } from '@/context/script-context';
import { useSettings } from '@/context/settings-context';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import ScriptBlockComponent from './script-block';
import SceneBlock from './scene-block';
import BlockSeparator from './block-separator';
import type { ScriptBlock } from '@/lib/editor-types';
import { ScriptBlockType } from '@/lib/editor-types';

interface ScriptEditorProps {
  isStandalone?: boolean;
  onEditScene?: (sceneNumber: number) => void;
}

export default function ScriptEditor({ isStandalone = false, onEditScene }: ScriptEditorProps) {
  const { document, setBlocks, isScriptLoading, activeMatch, scenes, deleteScene, insertBlockAfter } = useScript();
  const { settings } = useSettings();
  
  // Apply editor font size setting (default 16px if not set)
  const editorFontSize = settings.editorFontSize || 16;

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

  // Group blocks into scenes
  const groupedScenes: Array<{ sceneNumber: number; blocks: ScriptBlock[]; startIndex: number }> = [];
  let currentScene: ScriptBlock[] = [];
  let sceneCounter = 0;
  let startIndex = 0;

  document.blocks.forEach((block, index) => {
    if (block.type === ScriptBlockType.SCENE_HEADING) {
      // Save the previous scene if it exists
      if (currentScene.length > 0) {
        groupedScenes.push({
          sceneNumber: sceneCounter,
          blocks: currentScene,
          startIndex: startIndex,
        });
      }
      // Start a new scene
      sceneCounter++;
      currentScene = [block];
      startIndex = index;
    } else {
      // Add block to current scene
      currentScene.push(block);
    }
  });

  // Add the last scene
  if (currentScene.length > 0) {
    groupedScenes.push({
      sceneNumber: sceneCounter,
      blocks: currentScene,
      startIndex: startIndex,
    });
  }

  return (
    <div
      className={cn(
        'relative w-full font-code max-w-3xl mx-auto',
        isStandalone ? 'p-4' : 'bg-card shadow-sm rounded-lg border'
      )}
      style={{ fontSize: `${editorFontSize}px` }}
    >
      <div className={cn(isStandalone ? '' : 'p-8 md:p-12')}>
        {groupedScenes.length > 0 ? (
          // Render scenes as collapsible blocks
          groupedScenes.map((scene) => {
            const sceneData = scenes?.find(s => s.sceneNumber === scene.sceneNumber);
            return (
              <SceneBlock
                key={scene.startIndex}
                sceneNumber={scene.sceneNumber}
                sceneData={sceneData}
                blocks={scene.blocks}
                onBlockChange={handleBlockChange}
                onDeleteScene={() => deleteScene(scene.startIndex, scene.blocks.length)}
                onEditScene={onEditScene}
                highlightedBlockIndex={activeMatch?.blockIndex}
                startBlockIndex={scene.startIndex}
              />
            );
          })
        ) : (
          // Fallback: render blocks without scene grouping (e.g., no scene headings yet)
          document.blocks.map((block, index) => (
            <React.Fragment key={block.id}>
              <ScriptBlockComponent
                block={block}
                onChange={handleBlockChange}
                isHighlighted={activeMatch?.blockIndex === index}
                previousBlockType={index > 0 ? document.blocks[index - 1].type : undefined}
                nextBlockType={index < document.blocks.length - 1 ? document.blocks[index + 1].type : undefined}
              />
              {/* Add separator after each block except the last one */}
              {index < document.blocks.length - 1 && (
                <BlockSeparator 
                  onInsertBlock={(type: ScriptBlockType) => insertBlockAfter(block.id, '', type)}
                />
              )}
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
}
