'use client';

import * as React from 'react';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ScriptProvider } from '@/context/script-context';
import { useCurrentScript } from '@/context/current-script-context';
import { Skeleton } from '../ui/skeleton';
import { useRouter } from 'next/navigation';

export default function AppLayout({
  children,
  activeView
}: {
  children: React.ReactNode;
  activeView: 'dashboard' | 'editor' | 'scenes' | 'characters' | 'notes' | 'logline';
}) {
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();
  const router = useRouter();

  React.useEffect(() => {
    if (!isCurrentScriptLoading && !currentScriptId) {
      router.push('/profile');
    }
  }, [isCurrentScriptLoading, currentScriptId, router]);

  if (isCurrentScriptLoading || !currentScriptId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <p className="text-muted-foreground">Loading your script...</p>
        </div>
      </div>
    );
  }

  return (
    <ScriptProvider scriptId={currentScriptId}>
      <SidebarProvider>
        <div className="flex h-screen bg-background">
          <AppSidebar activeView={activeView} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <AppHeader />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ScriptProvider>
  );
}
