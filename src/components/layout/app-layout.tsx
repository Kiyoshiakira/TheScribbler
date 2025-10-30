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
import { useUser } from '@/firebase';
import { EditProfileDialog } from '../edit-profile-dialog';

export type View = 'dashboard' | 'editor' | 'scenes' | 'characters' | 'notes' | 'logline' | 'profile';

function AppLayoutContent() {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();
  const [view, setView] = React.useState<View>('profile');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const { user, isUserLoading } = useUser();
  
  // This effect ensures the correct view is shown based on script presence.
  React.useEffect(() => {
    if (!isCurrentScriptLoading) {
        if (currentScriptId) {
            // If there's a script and we're on the profile view, switch to dashboard.
            if (view === 'profile') {
                setView('dashboard');
            }
        } else {
            // If there's no script, force profile view.
            setView('profile');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScriptId, isCurrentScriptLoading]);


  const handleSetView = (newView: View | 'settings' | 'profile-edit') => {
    if (newView === 'settings') {
      setSettingsOpen(true);
    } else if (newView === 'profile-edit') {
      setProfileOpen(true);
    } else {
      // If no script is loaded, only allow navigating to the profile view.
      if (!currentScriptId && newView !== 'profile') {
          setView('profile');
          return;
      }
      setView(newView);
    }
  };

  const renderView = () => {
    if (isUserLoading || isCurrentScriptLoading) {
      return (
        <div className="flex h-full w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <p className="text-muted-foreground">Loading workspace...</p>
            </div>
        </div>
      );
    }

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

  if (isUserLoading || isCurrentScriptLoading) {
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
      {user && <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} user={user} profile={null} />}
    </>
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
  
  // If there is a script, wrap with the provider.
  if (currentScriptId) {
    return (
      <SidebarProvider>
        <ScriptProvider key={currentScriptId} scriptId={currentScriptId}>
            <AppLayoutContent />
        </ScriptProvider>
      </SidebarProvider>
    );
  }

  // If there is no script, render the layout content directly.
  // AppLayoutContent will handle showing the ProfileView, which does not need the ScriptContext.
  return (
    <SidebarProvider>
        <AppLayoutContent />
    </SidebarProvider>
  );
}
