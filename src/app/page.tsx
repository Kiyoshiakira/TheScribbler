'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import AppLayout from '@/components/layout/AppLayout';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isCheckingProfile, setIsCheckingProfile] = React.useState(false);

  React.useEffect(() => {
    const checkUserAndProfile = async () => {
      // If still loading user, wait
      if (isUserLoading) {
        return;
      }

      // If no user, redirect to login
      if (!user) {
        router.push('/login');
        return;
      }

      // If user exists, check if profile exists in Firestore
      if (firestore && !isCheckingProfile) {
        setIsCheckingProfile(true);
        try {
          const userDocRef = doc(firestore, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (!userDoc.exists()) {
            console.log('[Home] User profile does not exist, redirecting to onboarding');
            router.push('/onboarding');
          } else {
            console.log('[Home] User profile exists, showing app');
          }
        } catch (error) {
          console.error('[Home] Error checking user profile:', error);
        } finally {
          setIsCheckingProfile(false);
        }
      }
    };

    checkUserAndProfile();
  }, [user, isUserLoading, firestore, router, isCheckingProfile]);

  // While the initial user check is happening, show a simplified loading screen.
  // AppLayout will handle its own more detailed loading once the user is confirmed.
  if (isUserLoading || !user || isCheckingProfile) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Once the user is verified, render the full application layout.
  return <AppLayout />;
}
