'use client';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFirebase, useFirebaseApp } from '@/firebase';
import { Logo } from '@/components/layout/app-sidebar';
import { Skeleton } from '@/components/ui/skeleton';

const provider = new GoogleAuthProvider();

export default function LoginPage() {
  const { areServicesAvailable } = useFirebase();
  const app = useFirebaseApp();

  const handleSignIn = () => {
    // This check is a safeguard, but the button's disabled state is the primary fix.
    if (!areServicesAvailable) {
      console.error('Firebase services not available.');
      return;
    }
    try {
      const auth = getAuth(app);
      // signInWithRedirect doesn't need to be awaited as it navigates the page away.
      signInWithRedirect(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center gap-2">
            <Logo />
            <h1 className="text-2xl font-bold font-headline">ScriptSync</h1>
          </div>
          <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to access your projects and collaborate.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {areServicesAvailable ? (
                <Button onClick={handleSignIn} className="w-full">
                    Sign in with Google
                </Button>
            ) : (
                <Skeleton className="h-10 w-full" />
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
