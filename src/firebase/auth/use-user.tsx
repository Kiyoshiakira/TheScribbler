'use client';

import { useState, useEffect } from 'react';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';

// Internal state for user authentication
export interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export function useUserAuthState(auth: Auth | null): UserAuthState {
    const [userAuthState, setUserAuthState] = useState<UserAuthState>({
        user: null,
        isUserLoading: true,
        userError: null,
    });

    useEffect(() => {
        if (!auth) {
            setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
            return;
        }

        setUserAuthState({ user: null, isUserLoading: true, userError: null });

        const unsubscribe = onAuthStateChanged(
            auth,
            (firebaseUser) => {
                setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
            },
            (error) => {
                console.error("useUserAuthState: onAuthStateChanged error:", error);
                setUserAuthState({ user: null, isUserLoading: false, userError: error });
            }
        );
        return () => unsubscribe();
    }, [auth]);

    return userAuthState;
}


// The following hooks are exported from index.ts, which gets them from the main provider context.
// This file is now primarily for the auth state logic.
