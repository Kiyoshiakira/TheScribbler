'use client';

import { useEffect, useState } from 'react';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export interface UserProfileState {
  isChecking: boolean;
  profileExists: boolean | null;
  error: Error | null;
}

/**
 * Hook to check if a user profile exists in Firestore.
 * This is useful for determining if a new user needs to complete onboarding.
 */
export function useProfileExists(firestore: Firestore | null, user: User | null): UserProfileState {
  const [state, setState] = useState<UserProfileState>({
    isChecking: false,
    profileExists: null,
    error: null,
  });

  useEffect(() => {
    if (!firestore || !user) {
      setState({ isChecking: false, profileExists: null, error: null });
      return;
    }

    const checkProfile = async () => {
      setState({ isChecking: true, profileExists: null, error: null });
      
      try {
        console.log('[useProfileExists] Checking profile for user:', user.uid);
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        const exists = userDoc.exists();
        console.log('[useProfileExists] Profile exists:', exists);
        
        setState({ isChecking: false, profileExists: exists, error: null });
      } catch (error: any) {
        console.error('[useProfileExists] Error checking profile:', error);
        setState({ isChecking: false, profileExists: null, error });
      }
    };

    checkProfile();
  }, [firestore, user?.uid]); // Only re-check if user ID changes

  return state;
}
