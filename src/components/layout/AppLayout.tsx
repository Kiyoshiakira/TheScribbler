'use client';

import * as React from 'react';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ScriptProvider, useScript } from '@/context/script-context';
import { useCurrentScript } from '@/context/current-script-context';
import { Skeleton } from '../ui/skeleton';
import { SettingsDialog } from '../settings-dialog';
import MyScriptsView from '../views/my-scripts-view';
import DashboardView from '../views/dashboard-view';
import EditorView from '../views/editor-view';
import LoglineView from '../views/logline-view';
import ScenesView from '../views/scenes-view';
import CharactersView from '../views/characters-view';
import NotesView from '../views/notes-view';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Character } from '../views/characters-view';
import { EditProfileDialog } from '../edit-profile-dialog';

export type View = 'dashboard' | 'editor' | 'scenes' | 'characters' | 'notes' | 'logline' | 'my-scripts';

function AppLayoutContent() {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();
  const [view, setView] = React.useState<View>('dashboard');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const { lines } = useScript();

  const [wordCount, setWordCount] = React.useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = React.useState(0);
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const charactersCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'characters') : null),
    [firestore, user, currentScriptId]
  );
  const { data: characters, isLoading: areCharactersLoading } = useCollection<Character>(charactersCollection);
  
  const characterCount = characters?.length || 0;
  const pageCount = Math.round(estimatedMinutes);

  React.useEffect(() => {
    if (lines.length === 0) {
        setWordCount(0);
        setEstimatedMinutes(0);
        return;
    };
    const scriptContent = lines.map(l => l.text).join('\n');
    const words = scriptContent.trim().split(/\s+/).filter(Boolean);
    const count = words.length;
    setWordCount(count);
    
    const minutes = Math.round((count / 160) * 10) / 10;
    setEstimatedMinutes(minutes);
  }, [lines]);


  React.useEffect(() => {
    if (!isCurrentScriptLoading && !currentScriptId) {
      setView('my-scripts');
    } else if (!isCurrentScriptLoading && currentScriptId) {
        if(view === 'my-scripts') {
            setView('dashboard');
        }
    }
  }, [isCurrentScriptLoading, currentScriptId, view]);

  const handleSetView = (newView: View | 'settings' | 'profile') => {
    if (newView === 'settings') {
      setSettingsOpen(true);
    } else if (newView === 'profile') {
      setView('my-scripts');
    }
     else {
      setView(newView);
    }
  };

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <DashboardView />;
      case 'editor': return <EditorView />;
      case 'logline': return <LoglineView />;
      case 'scenes': return <ScenesView />;
      case 'characters': return <CharactersView />;
      case 'notes': return <NotesView />;
      case 'my-scripts': return <MyScriptsView setView={handleSetView} />;
      default: return <DashboardView />;
    }
  };

  const stats = {
    pageCount,
    characterCount,
    estimatedMinutes,
  };
  
  const isLoading = isCurrentScriptLoading || areCharactersLoading;

  return (
    <SidebarProvider>
        <div className="flex h-screen bg-background">
            <AppSidebar activeView={view} setView={handleSetView} stats={stats} isLoadingStats={isLoading} />
            <div className="flex flex-1 flex-col overflow-hidden">
                <AppHeader activeView={view} setView={handleSetView} />
                 <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {renderView()}
                </main>
            </div>
            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            {user && <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} user={user} profile={null} />}
        </div>
    </SidebarProvider>
  );
}


export default function AppLayout() {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();

  if (isCurrentScriptLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <p className="text-muted-foreground">Loading workspace...</p>
          </div>
        </div>
      );
  }
  
  if (currentScriptId) {
     return (
       <ScriptProvider scriptId={currentScriptId}>
           <AppLayoutContent />
       </ScriptProvider>
    );
  }

  return <AppLayoutContent />;
}
