'use client';

import * as React from 'react';

export type ToolType = 'ScriptScribbler' | 'StoryScribbler' | 'SonnetScribbler';

interface ToolContextType {
  currentTool: ToolType;
  setCurrentTool: (tool: ToolType) => void;
}

const ToolContext = React.createContext<ToolContextType | undefined>(undefined);

export function ToolProvider({ children }: { children: React.ReactNode }) {
  const [currentTool, setCurrentTool] = React.useState<ToolType>('ScriptScribbler');

  return (
    <ToolContext.Provider value={{ currentTool, setCurrentTool }}>
      {children}
    </ToolContext.Provider>
  );
}

export function useTool() {
  const context = React.useContext(ToolContext);
  if (context === undefined) {
    throw new Error('useTool must be used within a ToolProvider');
  }
  return context;
}
