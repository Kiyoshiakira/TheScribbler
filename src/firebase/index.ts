'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, User } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import { FirebaseContext, FirebaseContextState } from './provider';
import React, { useMemo, type DependencyList, useContext } from 'react';

// Store the initialized services in a module-level variable to act as a singleton.
let firebaseServices: { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; } | null = null;


// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore; } {
  if (typeof window === 'undefined') {
    // On the server, we can't rely on a singleton pattern across requests.
    // We create a new instance each time, assuming server-side rendering is isolated per request.
     if (!getApps().length) {
        const firebaseApp = initializeApp(firebaseConfig);
        return getSdks(firebaseApp);
    }
    return getSdks(getApp());
  }

  // On the client, we use the singleton pattern.
  if (!firebaseServices) {
    let app: FirebaseApp;
    
    try {
      app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    } catch (error) {
      // Re-throw with more helpful error message
      if (error instanceof Error && error.message.includes('invalid-api-key')) {
        throw new Error('Firebase API key is invalid. Please check your .env.local file and ensure NEXT_PUBLIC_FIREBASE_API_KEY is set correctly.');
      }
      throw error;
    }
    
    // Use the new initializeFirestore API for persistence
    try {
        const firestore = initializeFirestore(app, {
            localCache: persistentLocalCache({})
        });
        
        firebaseServices = {
            firebaseApp: app,
            auth: getAuth(app),
            firestore: firestore,
        };

    } catch (error: any) {
        // This catch block handles initialization errors, which are rare but possible.
        // Fallback to non-persistent Firestore if initialization fails.
        console.error("Firebase persistence initialization failed, falling back to in-memory cache:", error);
        
        const firestore = getFirestore(app);

        firebaseServices = {
            firebaseApp: app,
            auth: getAuth(app),
            firestore: firestore,
        };
    }
  }

  return firebaseServices;
}

export function getSdks(firebaseApp: FirebaseApp) {
  // On subsequent calls after initialization, we can just get the instance.
  // This part is more relevant for server environments or complex client scenarios.
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  if (!auth) {
      throw new Error('Firebase Auth service not available. Check FirebaseProvider setup.');
  }
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
   if (!firestore) {
      throw new Error('Firebase Firestore service not available. Check FirebaseProvider setup.');
  }
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
   if (!firebaseApp) {
      throw new Error('Firebase App instance not available. Check FirebaseProvider setup.');
  }
  return firebaseApp;
};

/**
 * Hook specifically for accessing the authenticated user's state.
 */
export const useUser = (): { user: User | null; isUserLoading: boolean; userError: Error | null } => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};


type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export * from './auth/use-user';
