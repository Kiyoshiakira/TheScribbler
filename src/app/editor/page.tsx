'use client';
import ScriptEditor from '@/components/script-editor';
import { ScriptProvider } from '@/context/script-context';
import { Toaster } from '@/components/ui/toaster';

export default function EditorPage() {
  return (
    <ScriptProvider>
      <main className="h-screen w-screen bg-background">
        <ScriptEditor isStandalone={true} />
        <Toaster />
      </main>
    </ScriptProvider>
  );
}
