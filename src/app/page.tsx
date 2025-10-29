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
import LoglineView from '@/components/views/logline-view';
import DashboardView from '@/components/views/dashboard-view';
import type { ScriptElement } from '@/components/script-editor';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentScript } from '@/context/current-script-context';
import type { AiProofreadScriptOutput } from '@/ai/flows/ai-proofread-script';
import { ScriptProvider } from '@/context/script-context';
import type { Character } from '@/components/views/characters-view';
import type { Scene } from '@/components/views/scenes-view';
import type { Note } from '@/components/views/notes-view';


export type View = 'dashboard' | 'editor' | 'scenes' | 'characters' | 'notes' | 'profile' | 'logline';

export type ProofreadSuggestion = AiProofreadScriptOutput['suggestions'][0];

function AppLayout({ setView, view }: { setView: (view: View) => void, view: View}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { currentScriptId } = useCurrentScript();
  const [activeScriptElement, setActiveScriptElement] =
    React.useState<ScriptElement | null>(null);

  // State lifted from ScriptEditor
  const [wordCount, setWordCount] = React.useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = React.useState(0);
  const router = useRouter();
  
  // Data fetching for export
    const charactersCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'characters') : null),
        [firestore, user, currentScriptId]
    );
    const { data: characters } = useCollection<Character>(charactersCollection);

    const notesCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'notes') : null),
        [firestore, user, currentScriptId]
    );
    const { data: notes } = useCollection<Note>(notesCollection);

    const scenesCollection = useMemoFirebase(
        () => (user && firestore && currentScriptId ? query(collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'scenes'), orderBy('sceneNumber')) : null),
        [firestore, user, currentScriptId]
    );
    const { data: scenes } = useCollection<Scene>(scenesCollection);

  // If there's no active script, redirect to the profile page to select one.
  React.useEffect(() => {
    if (!currentScriptId) {
      router.push('/profile');
    }
  }, [currentScriptId, router]);


  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardView setView={setView} />;
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
      case 'logline':
        return <LoglineView />;
      default:
        return <DashboardView setView={setView} />;
    }
  };
  
  if (!currentScriptId) {
    // While redirecting, show a loader or nothing
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <p className="text-sm text-muted-foreground">Redirecting to your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScriptProvider scriptId={currentScriptId!}>
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
            <AppHeader 
              setView={setView} 
              characters={characters}
              scenes={scenes}
              notes={notes}
            />
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
  const [view, setView] = React.useState<View>('dashboard');
  const router = useRouter();

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

  if (!currentScriptId) {
     // The AppLayout component will handle the redirection.
     // Show a loader while it does its work.
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <p className="text-sm text-muted-foreground">Redirecting to your profile...</p>
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
