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
import StoryScribblerView from '../views/story-scribbler-view';
import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { EditProfileDialog } from '../edit-profile-dialog';
import { doc } from 'firebase/firestore';
import { useTool } from '@/context/tool-context';


export type View = 'dashboard' | 'editor' | 'scenes' | 'characters' | 'notes' | 'logline' | 'profile' | 'outline' | 'chapters' | 'world' | 'timeline' | 'story-notes';

/**
 * This is the internal component that renders the main app layout.
 * It's wrapped by providers and handles all the core logic for views and data.
 */
function AppLayoutInternal() {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { currentTool } = useTool();

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

  // When the tool changes, switch to an appropriate default view
  React.useEffect(() => {
    if (currentTool === 'StoryScribbler') {
      // When switching to Story Scribbler, switch to outline view
      // unless we're on dashboard or profile
      if (view !== 'dashboard' && view !== 'profile') {
        setView('outline');
      }
    } else {
      // When switching to Script Scribbler, switch to dashboard or editor
      // unless we're already on a valid script view
      const scriptViews: View[] = ['dashboard', 'editor', 'scenes', 'characters', 'notes', 'logline', 'profile'];
      if (!scriptViews.includes(view)) {
        setView('dashboard');
      }
    }
  }, [currentTool, view]);

  // This effect handles the initial view logic once all data is loaded.
  React.useEffect(() => {
    if (isUserLoading || isCurrentScriptLoading) {
      return; // Wait for all loading to complete
    }

    // Default to dashboard view (profile is only accessible via top-right menu)
    setView('dashboard');

  }, [isUserLoading, currentScriptId, isCurrentScriptLoading]);


  const handleSetView = (newView: View | 'settings' | 'profile-edit') => {
    if (newView === 'settings') {
      setSettingsOpen(true);
    } else if (newView === 'profile-edit') {
      setProfileOpen(true);
    } else {
       // Profile and Dashboard are always accessible
       // Story Scribbler views are always accessible
       // Script Scribbler views (except dashboard/profile) require a script to be loaded
      const storyScribblerViews: View[] = ['outline', 'chapters', 'characters', 'world', 'timeline', 'story-notes'];
      const alwaysAccessibleViews = ['dashboard', 'profile'];
      
      if (alwaysAccessibleViews.includes(newView) || storyScribblerViews.includes(newView)) {
        setView(newView);
      } else if (currentScriptId) {
        // Only allow navigation to Script Scribbler views if a script is loaded.
        setView(newView);
      }
      // If no script is loaded and trying to access a script-specific view, do nothing
    }
  };

  const renderView = () => {
    // If StoryScribbler is selected, show Story Scribbler views
    if (currentTool === 'StoryScribbler') {
      if (view === 'profile') {
        return <ProfileView setView={handleSetView} />;
      } else if (view === 'dashboard') {
        return <DashboardView setView={handleSetView} />;
      }
      
      // Story Scribbler specific views - use the unified StoryScribblerView
      // which handles all tabs internally
      return <StoryScribblerView activeView={view} setView={handleSetView} />;
    }

    // ScriptScribbler views (existing logic)
    // Dashboard and Profile are always accessible
    // Other views require a script to be loaded
    const viewToRender = (currentScriptId || view === 'dashboard' || view === 'profile') ? view : 'dashboard';

    switch(viewToRender) {
      case 'dashboard': return <DashboardView setView={handleSetView} />;
      case 'editor': return <EditorView />;
      case 'logline': return <LoglineView />;
      case 'scenes': return <ScenesView />;
      case 'characters': return <CharactersView />;
      case 'notes': return <NotesView />;
      case 'profile': return <ProfileView setView={handleSetView} />;
      default: return <DashboardView setView={handleSetView} />;
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
