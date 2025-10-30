'use client';

import AiFab from '@/components/ai-fab';
import ScriptEditor from '@/components/script-editor';

export default function EditorView() {
  return (
    <div className="h-full w-full">
      <ScriptEditor isStandalone={false} />
      <AiFab />
    </div>
  );
}
