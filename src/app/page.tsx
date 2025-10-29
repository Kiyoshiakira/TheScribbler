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
import type { ScriptElement } from '@/components/script-editor';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export type View = 'editor' | 'scenes' | 'characters' | 'notes';

function AppLayout() {
  const [view, setView] = React.useState<View>('editor');
  const [activeScriptElement, setActiveScriptElement] =
    React.useState<ScriptElement | null>(null);

  const renderView = () => {
    switch (view) {
      case 'editor':
        return <EditorView onActiveLineTypeChange={setActiveScriptElement} />;
      case 'scenes':
        return <ScenesView />;
      case 'characters':
        return <CharactersView />;
      case 'notes':
        return <NotesView />;
      default:
        return <EditorView onActiveLineTypeChange={setActiveScriptElement} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <AppSidebar
          activeView={view}
          setActiveView={setView}
          activeScriptElement={view === 'editor' ? activeScriptElement : null}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {renderView()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
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

  return <AppLayout />;
}
