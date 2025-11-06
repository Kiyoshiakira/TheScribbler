'use client';

import React, { useEffect, useRef } from 'react';
import { ScriptBlockType } from '@/lib/editor-types';

interface BlockInsertMenuProps {
  onInsertBlock: (type: ScriptBlockType) => void;
  onClose: () => void;
  position: { x: number; y: number };
}

const BlockInsertMenu: React.FC<BlockInsertMenuProps> = ({
  onInsertBlock,
  onClose,
  position,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const blockTypes = [
    { type: ScriptBlockType.ACTION, label: 'Action' },
    { type: ScriptBlockType.CHARACTER, label: 'Character' },
    { type: ScriptBlockType.DIALOGUE, label: 'Dialogue' },
    { type: ScriptBlockType.PARENTHETICAL, label: 'Parenthetical' },
    { type: ScriptBlockType.SCENE_HEADING, label: 'Scene Heading' },
    { type: ScriptBlockType.TRANSITION, label: 'Transition' },
    { type: ScriptBlockType.SHOT, label: 'Shot' },
  ];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[160px]"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-b border-border mb-1">
        Insert Block
      </div>
      {blockTypes.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => {
            onInsertBlock(type);
            onClose();
          }}
          className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default BlockInsertMenu;
