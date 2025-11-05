'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { isFirebaseConfigValid, getFirebaseConfigError } from '@/firebase/config';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<ReturnType<typeof initializeFirebase> | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Check if Firebase config is valid before trying to initialize
    if (!isFirebaseConfigValid()) {
      const errorMessage = getFirebaseConfigError();
      setInitError(errorMessage || 'Firebase configuration is incomplete.');
      return;
    }

    try {
      const services = initializeFirebase();
      setFirebaseServices(services);
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setInitError(error instanceof Error ? error.message : 'Failed to initialize Firebase');
    }
  }, []);

  // Show error state if Firebase initialization failed
  if (initError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-destructive" />
              Firebase Configuration Error
            </CardTitle>
            <CardDescription>
              The application requires Firebase to be properly configured.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription className="mt-2">
                {initError}
              </AlertDescription>
            </Alert>
            <div className="bg-muted p-4 rounded-md">
              <p className="text-sm font-semibold mb-2">To fix this issue:</p>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Create a <code className="bg-background px-1 rounded">.env.local</code> file in the project root</li>
                <li>Add your Firebase configuration variables (see README.md for details)</li>
                <li>Restart the development server</li>
              </ol>
              <p className="text-sm mt-3 text-muted-foreground">
                See the README.md file for detailed setup instructions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while initializing
  if (!firebaseServices) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing Firebase...</p>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}