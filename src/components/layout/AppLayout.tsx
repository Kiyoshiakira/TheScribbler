'use client';

import * as React from 'react';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ScriptProvider } from '@/context/script-context';
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
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { EditProfileDialog } from '../edit-profile-dialog';
import { doc } from 'firebase/firestore';

export type View = 'dashboard' | 'editor' | 'scenes' | 'characters' | 'notes' | 'logline' | 'profile';

function AppLayoutInternal() {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [view, setView] = React.useState<View>(() => currentScriptId ? 'dashboard' : 'profile');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const userProfileRef = useMemoFirebase(() => {
    if (user && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  React.useEffect(() => {
    if (!isCurrentScriptLoading) {
      setView(currentScriptId ? 'dashboard' : 'profile');
    }
  }, [currentScriptId, isCurrentScriptLoading]);


  const handleSetView = (newView: View | 'settings' | 'profile-edit') => {
    if (newView === 'settings') {
      setSettingsOpen(true);
    } else if (newView === 'profile-edit') {
      setProfileOpen(true);
    } else {
      if (!currentScriptId && newView !== 'profile') {
          setView('profile');
          return;
      }
      setView(newView);
    }
  };

  const renderView = () => {
    // If there's no script, always show the profile view.
    if (!currentScriptId) {
      return <ProfileView setView={handleSetView} />;
    }

    switch(view) {
      case 'dashboard': return <DashboardView setView={handleSetView} />;
      case 'editor': return <EditorView />;
      case 'logline': return <LoglineView />;
      case 'scenes': return <ScenesView />;
      case 'characters': return <CharactersView />;
      case 'notes': return <NotesView />;
      case 'profile': return <ProfileView setView={handleSetView} />;
      default: return <ProfileView setView={handleSetView} />;
    }
  };

  if (isUserLoading || isCurrentScriptLoading || (user && isProfileLoading)) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-background">
        <AppSidebar activeView={view} setView={handleSetView} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader activeView={view} setView={handleSetView} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {renderView()}
          </main>
        </div>
      </div>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      {user && <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} user={user} profile={userProfile} />}
    </>
  );
}


export default function AppLayout() {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();

  // Show a top-level loader while we determine if there's a script
  if (isCurrentScriptLoading) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <p className="text-muted-foreground">Loading workspace...</p>
          </div>
        </div>
      );
  }
  
  // Conditionally wrap with ScriptProvider ONLY if a script is active.
  // This prevents errors in views that don't need script data.
  return (
    <SidebarProvider>
      {currentScriptId ? (
        <ScriptProvider key={currentScriptId} scriptId={currentScriptId}>
            <AppLayoutInternal />
        </ScriptProvider>
      ) : (
        <AppLayoutInternal />
      )}
    </SidebarProvider>
  );
}
