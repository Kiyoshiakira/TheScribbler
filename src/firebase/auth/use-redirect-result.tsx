'use client';

import { useEffect, useState } from 'react';
import { Auth, getRedirectResult, UserCredential } from 'firebase/auth';

export interface RedirectResultState {
  isProcessing: boolean;
  userCredential: UserCredential | null;
  error: Error | null;
}

/**
 * Hook to handle the redirect result from OAuth providers like Google.
 * This should be called once when the app loads to process any pending redirect results.
 */
export function useRedirectResult(auth: Auth | null): RedirectResultState {
  const [state, setState] = useState<RedirectResultState>({
    isProcessing: true,
    userCredential: null,
    error: null,
  });

  useEffect(() => {
    if (!auth) {
      // Auth not yet available - keep isProcessing true to show loading state
      // until auth is initialized and we can check for redirect results
      return;
    }

    // Set isProcessing to true when starting to check for redirect results
    // This ensures the loading state is shown while getRedirectResult is pending
    setState({ isProcessing: true, userCredential: null, error: null });

    const handleRedirectResult = async () => {
      try {
        console.log('[useRedirectResult] Checking for redirect result...');
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log('[useRedirectResult] Redirect result found:', {
            user: result.user.uid,
            providerId: result.providerId,
          });
          setState({ isProcessing: false, userCredential: result, error: null });
        } else {
          console.log('[useRedirectResult] No redirect result found');
          setState({ isProcessing: false, userCredential: null, error: null });
        }
      } catch (error: any) {
        console.error('[useRedirectResult] Error processing redirect result:', error);
        setState({ isProcessing: false, userCredential: null, error });
      }
    };

    handleRedirectResult();
  }, [auth]);

  return state;
}
