'use client';
import { useState, useEffect } from 'react';
import AiFab from '@/components/ai-fab';
import ScriptEditor, { ScriptElement } from '@/components/script-editor';
import { useScript } from '@/context/script-context';

interface EditorViewProps {
  isStandalone: boolean;
}

export default function EditorView(props: EditorViewProps) {
  const { lines, setLines } = useScript();
  const [wordCount, setWordCount] = useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = useState(0);
  const [activeScriptElement, setActiveScriptElement] = useState<ScriptElement | null>(null);

  useEffect(() => {
    if (lines.length === 0) return;
    const newScriptContent = lines.map(line => line.text.replace(/<br>/g, '')).join('\n');

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newScriptContent.replace(/<br>/g, '\n');
    const textOnly = tempDiv.textContent || tempDiv.innerText || '';
    const words = textOnly.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    setWordCount(count);
    
    const minutes = Math.round((count / 160) * 10) / 10;
    setEstimatedMinutes(minutes);
  }, [lines]);

  const editorProps = {
    onActiveLineTypeChange: setActiveScriptElement,
    setWordCount: setWordCount,
    setEstimatedMinutes: setEstimatedMinutes,
  }

  return (
    <div className="relative h-full">
      <ScriptEditor {...editorProps} isStandalone={false} />
      <AiFab />
    </div>
  );
}
