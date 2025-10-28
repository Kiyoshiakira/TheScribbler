'use client';

import * as React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import EditorView from '@/components/views/editor-view';
import ScenesView from '@/components/views/scenes-view';
import CharactersView from '@/components/views/characters-view';
import NotesView from '@/components/views/notes-view';
import type { ScriptElement } from '@/components/script-editor';
import { ScriptProvider } from '@/context/script-context';

export type View = 'editor' | 'scenes' | 'characters' | 'notes';

export default function Home() {
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
      <div className="flex min-h-screen bg-background">
        <AppSidebar
          activeView={view}
          setActiveView={setView}
          activeScriptElement={view === 'editor' ? activeScriptElement : null}
        />
        <div className="flex flex-col flex-1 w-full">
          <AppHeader />
          <main className="p-4 sm:p-6 lg:p-8 flex-1">{renderView()}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
