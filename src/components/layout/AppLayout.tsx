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
import BeatboardView from '../views/beatboard-view';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { EditProfileDialog } from '../edit-profile-dialog';
import { doc } from 'firebase/firestore';
import { FindReplaceProvider } from '@/hooks/use-find-replace';


export type View = 'dashboard' | 'editor' | 'scenes' | 'characters' | 'notes' | 'logline' | 'profile' | 'beatboard';

/**
 * This is the internal component that renders the main app layout.
 * It's wrapped by providers and handles all the core logic for views and data.
 */
function AppLayoutInternal() {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [view, setView] = React.useState<View>('dashboard');
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  // Fetch user profile data from Firestore
  const userProfileRef = useMemoFirebase(() => {
    if (user && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  // This effect handles the initial view logic once all data is loaded.
  React.useEffect(() => {
    if (isUserLoading || isCurrentScriptLoading) {
      return; // Wait for all loading to complete
    }

    // If there is no script, force profile view. Otherwise, default to dashboard.
    const initialView = currentScriptId ? 'dashboard' : 'profile';
    setView(initialView);

  }, [isUserLoading, currentScriptId, isCurrentScriptLoading]);


  const handleSetView = (newView: View | 'settings' | 'profile-edit') => {
    if (newView === 'settings') {
      setSettingsOpen(true);
    } else if (newView === 'profile-edit') {
      setProfileOpen(true);
    } else {
       // Allow navigation to dashboard or profile anytime.
       // For other views, a script must be loaded.
      if (newView === 'dashboard' || newView === 'profile') {
        setView(newView);
      } else if (currentScriptId) {
        // Only allow navigation to other views if a script is loaded.
        setView(newView);
      } else {
        // If no script is loaded and trying to access a script-specific view, stay on profile.
        setView('profile');
      }
    }
  };

  const renderView = () => {
    // If no script is loaded, force the profile view unless the user explicitly selected the dashboard.
    const viewToRender = currentScriptId ? view : (view === 'dashboard' ? 'dashboard' : 'profile');

    switch(viewToRender) {
      case 'dashboard': return <DashboardView setView={handleSetView} />;
      case 'editor': return <EditorView />;
      case 'logline': return <LoglineView />;
      case 'scenes': return <ScenesView />;
      case 'characters': return <CharactersView />;
      case 'notes': return <NotesView />;
      case 'beatboard': return <BeatboardView />;
      case 'profile': return <ProfileView setView={handleSetView} />;
      default: return <ProfileView setView={handleSetView} />;
    }
  };
  
  const centralLoading = isUserLoading || isCurrentScriptLoading || isProfileLoading;

  if (centralLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <p className="text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
      // This is a fallback while the redirect to /login is happening.
      return null;
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


/**
 * The main AppLayout component. It wraps the internal layout with necessary providers.
 */
export default function AppLayout() {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();

  if (isCurrentScriptLoading) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      );
  }

  return (
    <SidebarProvider>
      {currentScriptId ? (
        <ScriptProvider key={currentScriptId} scriptId={currentScriptId}>
          <AppLayoutInternal />
        </ScriptProvider>
      ) : (
        // Render without ScriptProvider if no script is selected
        <ScriptProvider scriptId="">
            <AppLayoutInternal />
        </ScriptProvider>
      )}
    </SidebarProvider>
  );
}
