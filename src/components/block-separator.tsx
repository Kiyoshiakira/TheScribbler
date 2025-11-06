'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ScriptBlockType } from '@/lib/editor-types';
import { cn } from '@/lib/utils';
import BlockInsertMenu from './block-insert-menu';

interface BlockSeparatorProps {
  onInsertBlock: (type: ScriptBlockType) => void;
}

const BlockSeparator: React.FC<BlockSeparatorProps> = ({ onInsertBlock }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  return (
    <>
      <div 
        className={cn(
          "group/separator relative h-1 my-1 cursor-pointer",
          "hover:bg-primary/10 transition-colors rounded"
        )}
        onClick={handleClick}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/separator:opacity-100 transition-opacity">
          <div className="bg-primary text-primary-foreground rounded-full p-0.5">
            <Plus className="h-3 w-3" />
          </div>
        </div>
      </div>
      {showMenu && (
        <BlockInsertMenu
          onInsertBlock={(type) => {
            onInsertBlock(type);
            setShowMenu(false);
          }}
          onClose={() => setShowMenu(false)}
          position={menuPosition}
        />
      )}
    </>
  );
};

export default BlockSeparator;
