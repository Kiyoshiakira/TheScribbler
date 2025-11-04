'use client';

import { useState } from 'react';
import AiFab from '@/components/ai-fab';
import ScriptEditor from '@/components/script-editor';
import { Button } from '../ui/button';
import { Search } from 'lucide-react';
import { FindReplaceDialog } from '../find-replace-dialog';
import { FindReplaceProvider } from '@/hooks/use-find-replace';
import EditorStatusBar from '../editor-status-bar';

function EditorViewContent() {
  const [isFindOpen, setIsFindOpen] = useState(false);
  return (
      <div className="relative h-full w-full flex flex-col">
        <div className="absolute top-0 right-0 z-10">
          <Button variant="outline" size="sm" onClick={() => setIsFindOpen(true)}>
            <Search className="mr-2 h-4 w-4" />
            Find & Replace
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto pt-4 pb-24">
          <ScriptEditor isStandalone={false} />
        </div>
        <EditorStatusBar />
        <AiFab />
        <FindReplaceDialog open={isFindOpen} onOpenChange={setIsFindOpen} />
      </div>
  )
}


export default function EditorView() {
  return (
    <FindReplaceProvider>
      <EditorViewContent />
    </FindReplaceProvider>
  );
}
