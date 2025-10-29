'use client';
import { useState, useEffect } from 'react';
import AiFab from '@/components/ai-fab';
import ScriptEditor, { ScriptElement } from '@/components/script-editor';
import { useScript } from '@/context/script-context';

interface EditorViewProps {
  isStandalone: boolean;
}

// This component no longer needs to manage word count and time,
// as that logic is now centralized in AppLayout.
export default function EditorView({ isStandalone }: EditorViewProps) {
  const [activeScriptElement, setActiveScriptElement] = useState<ScriptElement | null>(null);

  const editorProps = {
    onActiveLineTypeChange: setActiveScriptElement,
    // The setWordCount and setEstimatedMinutes props are no longer needed here
    // but the editor component itself might still expect them. We'll pass dummy functions.
    setWordCount: () => {},
    setEstimatedMinutes: () => {},
  }

  return (
    <div className="relative h-full">
      <ScriptEditor {...editorProps} isStandalone={isStandalone} />
      <AiFab />
    </div>
  );
}
