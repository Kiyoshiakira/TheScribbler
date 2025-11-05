'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Clock, MapPin } from 'lucide-react';
import ScriptBlockComponent from './script-block';
import type { ScriptBlock } from '@/lib/editor-types';
import type { Scene } from './views/scenes-view';

interface SceneBlockProps {
  sceneNumber: number;
  sceneData?: Scene;
  blocks: ScriptBlock[];
  onBlockChange: (blockId: string, newText: string) => void;
  highlightedBlockIndex: number | undefined;
  startBlockIndex: number;
}

const SceneBlock: React.FC<SceneBlockProps> = ({
  sceneNumber,
  sceneData,
  blocks,
  onBlockChange,
  highlightedBlockIndex,
  startBlockIndex,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const hasSceneData = !!sceneData;

  return (
    <div className="scene-block mb-8 border-l-4 border-primary/30 pl-4 relative">
      {/* Scene Header */}
      <div className="flex items-start gap-2 mb-4 -ml-4 pl-4 py-2 bg-primary/5 rounded-r-lg group hover:bg-primary/10 transition-colors">
        <button
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
      </div>

      {/* Scene Content */}
      {!isCollapsed && (
        <div className="scene-content space-y-0">
          {blocks.map((block, index) => (
            <ScriptBlockComponent
              key={block.id}
              block={block}
              onChange={onBlockChange}
              isHighlighted={highlightedBlockIndex === startBlockIndex + index}
            />
          ))}
        </div>
      )}

      {/* Collapsed Preview */}
      {isCollapsed && (
        <div className="text-sm text-muted-foreground italic">
          {blocks.length} block{blocks.length !== 1 ? 's' : ''} (collapsed)
        </div>
      )}
    </div>
  );
};

export default SceneBlock;
