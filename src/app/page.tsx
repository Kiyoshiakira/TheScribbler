'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import EditorView from '@/components/views/editor-view';
import ScenesView from '@/components/views/scenes-view';
import CharactersView from '@/components/views/characters-view';
import NotesView from '@/components/views/notes-view';
import MyScriptsView from '@/components/views/my-scripts-view';
import type { ScriptElement } from '@/components/script-editor';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentScript } from '@/context/current-script-context';
import type { AiProofreadScriptOutput } from '@/ai/flows/ai-proofread-script';
import { ScriptProvider } from '@/context/script-context';

export type View = 'editor' | 'scenes' | 'characters' | 'notes' | 'my-scripts';

export type ProofreadSuggestion = AiProofreadScriptOutput['suggestions'][0];

function AppLayout({ setView, view }: { setView: (view: View) => void, view: View}) {
  const { currentScriptId } = useCurrentScript();
  const [activeScriptElement, setActiveScriptElement] =
    React.useState<ScriptElement | null>(null);

  // State lifted from ScriptEditor
  const [wordCount, setWordCount] = React.useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = React.useState(0);


  const renderView = () => {
    switch (view) {
      case 'editor':
        return <EditorView 
            onActiveLineTypeChange={setActiveScriptElement}
            setWordCount={setWordCount}
            setEstimatedMinutes={setEstimatedMinutes}
            isStandalone={false}
         />;
      case 'scenes':
        return <ScenesView />;
      case 'characters':
        return <CharactersView />;
      case 'notes':
        return <NotesView />;
      case 'my-scripts':
        return <MyScriptsView setView={setView} />;
      default:
        return <EditorView 
            onActiveLineTypeChange={setActiveScriptElement}
            setWordCount={setWordCount}
            setEstimatedMinutes={setEstimatedMinutes}
            isStandalone={false}
        />;
    }
  };
  
  if (!currentScriptId) {
    // This can happen briefly during loading, or if no scripts exist.
    // MyScriptsView will handle the "no scripts" case.
    return (
       <SidebarProvider>
            <div className="flex h-screen bg-background">
                <AppSidebar
                    activeView={view}
                    setActiveView={setView}
                    activeScriptElement={null}
                    wordCount={0}
                    estimatedMinutes={0}
                />
                <div className="flex flex-1 flex-col overflow-hidden">
                    <AppHeader setView={setView} />
                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                         <MyScriptsView setView={setView} />
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
  }

  return (
    <ScriptProvider scriptId={currentScriptId}>
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <AppSidebar
            activeView={view}
            setActiveView={setView}
            activeScriptElement={view === 'editor' ? activeScriptElement : null}
            wordCount={wordCount}
            estimatedMinutes={estimatedMinutes}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <AppHeader setView={setView} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {renderView()}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ScriptProvider>
  );
}

function MainApp() {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();
  const [view, setView] = React.useState<View>('my-scripts');

  React.useEffect(() => {
    if (!isCurrentScriptLoading) {
      if (currentScriptId) {
        setView('editor');
      } else {
        setView('my-scripts');
      }
    }
  }, [currentScriptId, isCurrentScriptLoading]);


  if (isCurrentScriptLoading) {
     return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return <AppLayout view={view} setView={setView} />;
}


export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return <MainApp />;
}
