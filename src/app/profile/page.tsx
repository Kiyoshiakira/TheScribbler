'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import AppHeader from '@/components/layout/app-header';
import MyScriptsView from '@/components/views/my-scripts-view';
import { useUser } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { View } from '@/app/page';

export default function ProfilePage() {
  const [view, setView] = React.useState<View>('profile');
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

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        <AppSidebar
          activeView={view}
          setActiveView={setView}
          activeScriptElement={null}
          wordCount={0}
          estimatedMinutes={0}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader setView={setView} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <MyScriptsView setView={setView} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
