'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, MapPin, Trash2, Edit, Check, Undo2 } from 'lucide-react';
import ScriptBlockComponent from './script-block';
import BlockSeparator from './block-separator';
import type { ScriptBlock, ScriptBlockType } from '@/lib/editor-types';
import type { Scene } from './views/scenes-view';
import { useScript } from '@/context/script-context';
import { Button } from './ui/button';

interface SceneBlockProps {
  sceneNumber: number;
  sceneData?: Scene;
  blocks: ScriptBlock[];
  onBlockChange: (blockId: string, newText: string) => void;
  onDeleteScene?: () => void;
  onEditScene?: (sceneNumber: number) => void;
  highlightedBlockIndex: number | undefined;
  startBlockIndex: number;
}

const SceneBlock: React.FC<SceneBlockProps> = ({
  sceneNumber,
  sceneData,
  blocks,
  onBlockChange,
  onDeleteScene,
  onEditScene,
  highlightedBlockIndex,
  startBlockIndex,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const { insertBlockAfter } = useScript();

  const hasSceneData = !!sceneData;

  return (
    <div className="scene-block mb-8 border-l-4 border-primary/30 pl-4 relative">
      {/* Scene Header */}
      <div className="flex items-start gap-2 mb-4 -ml-4 pl-4 py-2 bg-primary/5 rounded-r-lg group hover:bg-primary/10 transition-colors">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex-shrink-0 p-1 hover:bg-primary/20 rounded transition-colors"
          aria-label={isCollapsed ? 'Expand scene' : 'Collapse scene'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-primary" />
          ) : (
            <ChevronDown className="h-5 w-5 text-primary" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-primary font-headline">
              SCENE {sceneNumber}
            </span>
            {hasSceneData && sceneData.setting && (
              <>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{sceneData.setting}</span>
                </div>
              </>
            )}
            {hasSceneData && sceneData.time && (
              <>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{sceneData.time} min</span>
                </div>
              </>
            )}
          </div>
          {hasSceneData && sceneData.description && !isCollapsed && (
            <p className="text-sm text-muted-foreground mt-1 italic">
              {sceneData.description}
            </p>
          )}
        </div>

        {/* Delete Scene Button */}
        {onDeleteScene && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              // Note: Using browser confirm() for now. Could be enhanced with a custom dialog component in the future.
              if (confirm(`Delete Scene ${sceneNumber} and all its ${blocks.length} block(s)?`)) {
                onDeleteScene();
              }
            }}
            className="flex-shrink-0 p-1 hover:bg-destructive/20 rounded transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete scene"
            title="Delete entire scene"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </button>
        )}
      </div>

      {/* Scene Content - Hidden when collapsed to avoid confusing keyboard navigation */}
      <div className={isCollapsed ? 'hidden' : 'scene-content space-y-0'}>
        {blocks.map((block, index) => (
          <React.Fragment key={block.id}>
            <ScriptBlockComponent
              block={block}
              onChange={onBlockChange}
              isHighlighted={highlightedBlockIndex === startBlockIndex + index}
              previousBlockType={index > 0 ? blocks[index - 1].type : undefined}
              nextBlockType={index < blocks.length - 1 ? blocks[index + 1].type : undefined}
            />
            {/* Add separator after each block except the last one */}
            {index < blocks.length - 1 && (
              <BlockSeparator 
                onInsertBlock={(type: ScriptBlockType) => insertBlockAfter(block.id, '', type)}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Collapsed Preview */}
      {isCollapsed && (
        <div className="text-sm text-muted-foreground italic">
          {blocks.length} block{blocks.length !== 1 ? 's' : ''} (collapsed)
        </div>
      )}

      {/* End Scene / Edit Scene Section */}
      {!isCollapsed && (
        <div className="mt-4 mb-2 flex items-center justify-end gap-2 pr-2">
          {!isEnded ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEnded(true)}
              className="text-primary hover:bg-primary/10"
            >
              <Check className="mr-2 h-4 w-4" />
              End Scene
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground italic">Scene ended</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEnded(false)}
                className="text-muted-foreground hover:bg-muted/50"
                title="Undo scene end"
              >
                <Undo2 className="mr-2 h-4 w-4" />
                Undo
              </Button>
              {onEditScene && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditScene(sceneNumber)}
                  className="text-primary hover:bg-primary/10"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Scene
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SceneBlock;
