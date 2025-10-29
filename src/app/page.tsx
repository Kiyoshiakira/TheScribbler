'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useCurrentScript } from '@/context/current-script-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const { currentScriptId, isCurrentScriptLoading } = useCurrentScript();
  const router = useRouter();

  React.useEffect(() => {
    if (isUserLoading || isCurrentScriptLoading) {
      return; // Wait until all loading is complete
    }

    if (!user) {
      router.push('/login');
    } else if (currentScriptId) {
      router.push('/dashboard');
    } else {
      router.push('/profile');
    }
  }, [user, isUserLoading, currentScriptId, isCurrentScriptLoading, router]);

  // Show a full-page loader while determining where to redirect.
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <p className="text-muted-foreground">Loading your workspace...</p>
      </div>
    </div>
  );
}
