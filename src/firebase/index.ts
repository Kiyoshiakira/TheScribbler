'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

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
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(app);

    try {
        enableIndexedDbPersistence(firestore);
    } catch (error: any) {
        if (error.code == 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time.
            console.warn('Firestore persistence failed to enable. This is expected if you have multiple tabs open.');
        } else if (error.code == 'unimplemented') {
            // The current browser does not support all of the features required to enable persistence
            console.warn('Firestore persistence is not supported in this browser.');
        }
    }

    firebaseServices = {
        firebaseApp: app,
        auth: getAuth(app),
        firestore: firestore,
    };
  }

  return firebaseServices;
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
