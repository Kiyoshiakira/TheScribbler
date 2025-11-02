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
import { useRouter } from 'next/navigation';


export type View = 'dashboard' | 'editor' | 'scenes' | 'characters' | 'notes' | 'logline' | 'profile' | 'beatboard';

/**
 * This is the internal component that renders the main app layout.
 * It's wrapped by providers and handles all the core logic for views and data.
 */
function AppLayoutInternal() {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [view, setView] = React.useState<View>('profile');
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
    console.log('[AppLayout] Effect running. Dependencies:', { isUserLoading, isCurrentScriptLoading, user: !!user, currentScriptId });
    if (isUserLoading || isCurrentScriptLoading) {
      console.log('[AppLayout] Waiting for user or script to load...');
      return; // Wait for all loading to complete
    }

    if (!user) {
      console.log('[AppLayout] No user found. Redirecting to /login.');
      router.push('/login');
      return;
    }
    
    // If there is no script, force profile view. Otherwise, default to dashboard.
    const initialView = currentScriptId ? 'dashboard' : 'profile';
    console.log(`[AppLayout] Setting initial view to: ${initialView}. (Has script: ${!!currentScriptId})`);
    setView(initialView);

  }, [user, isUserLoading, currentScriptId, isCurrentScriptLoading, router]);


  const handleSetView = (newView: View | 'settings' | 'profile-edit') => {
    if (newView === 'settings') {
      setSettingsOpen(true);
    } else if (newView === 'profile-edit') {
      setProfileOpen(true);
    } else {
      console.log(`[AppLayout] View changed to: ${newView}`);
      setView(newView);
    }
  };

  const renderView = () => {
    // Determine the correct view to render.
    // If no script is loaded, always show the profile view.
    const viewToRender = currentScriptId ? view : 'profile';

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

  const centralLoading = isUserLoading || isCurrentScriptLoading || (user && isProfileLoading);
  console.log('[AppLayout] Central loading state:', { centralLoading, isUserLoading, isCurrentScriptLoading, isProfileLoading: !!(user && isProfileLoading) });


  // Show a single, centralized loading screen.
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
      console.log('[AppLayout] Render blocked, no user object.');
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

  // The loading screen is handled inside AppLayoutInternal, but we can show a minimal one here
  // to avoid a flash of content.
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
      {/* Conditionally wrap with ScriptProvider only when a script is loaded */}
      {currentScriptId ? (
        <ScriptProvider key={currentScriptId} scriptId={currentScriptId}>
            <AppLayoutInternal />
        </ScriptProvider>
      ) : (
        // Render without ScriptProvider if no script is selected
        <AppLayoutInternal />
      )}
    </SidebarProvider>
  );
}
