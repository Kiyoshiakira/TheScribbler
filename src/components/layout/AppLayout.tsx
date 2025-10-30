'use client';

import * as React from 'react';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ScriptProvider, useScript } from '@/context/script-context';
import { useCurrentScript } from '@/context/current-script-context';
import { Skeleton } from '../ui/skeleton';
import { SettingsDialog } from '../settings-dialog';
import ProfileView from '../views/profile-view';
import DashboardView from '../views/dashboard-view';
import EditorView from '../views/editor-view';
import LoglineView from '../views/logline-view';
import ScenesView from '../views/scenes-view';
import CharactersView from '../views/characters-view';
import NotesView from '../views/notes-view';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy } from 'firebase/firestore';
import type { Character } from '../views/characters-view';
import type { Scene } from '../views/scenes-view';
import type { Note } from '../views/notes-view';
import { EditProfileDialog } from '../edit-profile-dialog';

export type View = 'dashboard' | 'editor' | 'scenes' | 'characters' | 'notes' | 'logline' | 'profile';

function AppLayoutContent() {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();
  const [view, setView] = React.useState<View>('dashboard');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const { lines, isScriptLoading: isScriptContentLoading } = useScript();

  const [wordCount, setWordCount] = React.useState(0);
  const [estimatedMinutes, setEstimatedMinutes] = React.useState(0);
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

   const userDocRef = useMemoFirebase(
    () => (user && firestore ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userDocRef, { revalidateOnFocus: !profileOpen });


  const charactersCollectionRef = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'characters') : null),
    [firestore, user, currentScriptId]
  );
  const { data: characters, isLoading: areCharactersLoading } = useCollection<Character>(charactersCollectionRef);

  const scenesCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'scenes') : null),
    [firestore, user, currentScriptId]
  );
  const scenesQuery = useMemoFirebase(
    () => (scenesCollection ? query(scenesCollection, orderBy('sceneNumber', 'asc')) : null),
    [scenesCollection]
  );
  const { data: scenes, isLoading: areScenesLoading } = useCollection<Scene>(scenesQuery);
  
  const notesCollection = useMemoFirebase(
    () => (user && firestore && currentScriptId ? collection(firestore, 'users', user.uid, 'scripts', currentScriptId, 'notes') : null),
    [firestore, user, currentScriptId]
  );
  const { data: notes, isLoading: areNotesLoading } = useCollection<Note>(notesCollection);
  
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
    if (isCurrentScriptLoading) {
      return; // Do nothing while loading
    }
  
    // After loading, decide the view
    if (!currentScriptId) {
      setView('profile'); // If no scripts, show profile
    } else {
      // If there is a script, but the current view is profile, switch to dashboard.
      // This handles creating a new script from the profile page.
      // Otherwise, we keep the user's current view.
      if (view === 'profile') {
        setView('dashboard');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCurrentScriptLoading, currentScriptId]); 


  const handleSetView = (newView: View | 'settings' | 'profile-edit') => {
    if (newView === 'settings') {
      setSettingsOpen(true);
    } else if (newView === 'profile-edit') {
        setProfileOpen(true);
    } else {
      setView(newView);
    }
  };

  const renderView = () => {
    switch(view) {
      case 'dashboard': return <DashboardView setView={handleSetView} />;
      case 'editor': return <EditorView />;
      case 'logline': return <LoglineView />;
      case 'scenes': return <ScenesView />;
      case 'characters': return <CharactersView />;
      case 'notes': return <NotesView />;
      case 'profile': return <ProfileView setView={handleSetView} />;
      default: return <DashboardView setView={handleSetView}/>;
    }
  };

  const stats = {
    pageCount,
    characterCount,
    estimatedMinutes,
  };
  
  const isLoading = isCurrentScriptLoading || areCharactersLoading || isScriptContentLoading || areScenesLoading || areNotesLoading;

  return (
    <SidebarProvider>
        <div className="flex h-screen bg-background">
            <AppSidebar activeView={view} setView={handleSetView} stats={stats} isLoadingStats={isLoading} />
            <div className="flex flex-1 flex-col overflow-hidden">
                <AppHeader 
                    activeView={view} 
                    setView={handleSetView}
                />
                 <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {renderView()}
                </main>
            </div>
            <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            {user && <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} user={user} profile={userProfile || null} />}
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
  
  // If there is a scriptId, wrap the content in a ScriptProvider to load it.
  // Otherwise, render the layout which will default to the profile view.
  if (currentScriptId) {
     return (
       <ScriptProvider key={currentScriptId} scriptId={currentScriptId}>
           <AppLayoutContent />
       </ScriptProvider>
    );
  }

  // Render the layout without a script context (will show the profile view)
  return <AppLayoutContent />;
}
