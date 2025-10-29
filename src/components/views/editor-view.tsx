'use client';
import { useState } from 'react';
import AiFab from '@/components/ai-fab';
import ScriptEditor, { ScriptElement } from '@/components/script-editor';

export default function EditorView() {
  const [activeScriptElement, setActiveScriptElement] = useState<ScriptElement | null>(null);

  // These props are passed down but the core logic is now handled in AppLayout
  const editorProps = {
    onActiveLineTypeChange: setActiveScriptElement,
    setWordCount: () => {},
    setEstimatedMinutes: () => {},
  }

  return (
    <>
      <ScriptEditor {...editorProps} isStandalone={false} />
      <AiFab />
    </>
  );
}
