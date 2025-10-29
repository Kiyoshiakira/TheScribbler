'use client';
import AiFab from '@/components/ai-fab';
import ScriptEditor, { ScriptElement } from '@/components/script-editor';

interface EditorViewProps {
  onActiveLineTypeChange: (type: ScriptElement | null) => void;
  isStandalone: boolean;
  setWordCount: (count: number) => void;
  setEstimatedMinutes: (minutes: number) => void;
}

function EditorWithAssistant(props: Omit<EditorViewProps, 'isStandalone'>) {
  return (
    <div className="relative h-full">
      <ScriptEditor {...props} isStandalone={false} />
      <AiFab />
    </div>
  );
}

export default function EditorView(props: EditorViewProps) {
  return (
      <>
        {props.isStandalone ? (
            <ScriptEditor {...props} />
        ) : (
            <EditorWithAssistant {...props} />
        )}
      </>
  );
}
