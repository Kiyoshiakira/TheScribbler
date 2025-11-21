'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase';
import { useToast } from './use-toast';
import { getAuth, onIdTokenChanged } from 'firebase/auth';
import { importFromGoogleDocs, scriptDocumentToText, extractPlainTextFromGoogleDocs } from '@/lib/import-google-docs';

// Extend window type for Google API
declare global {
  interface Window {
    gapi: typeof gapi;
    google: typeof google;
  }
}

const DEVELOPER_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const APP_ID = process.env.NEXT_PUBLIC_GOOGLE_APP_ID;

interface GooglePickerOptions {
  onFilePicked: (fileName: string, fileContent: string) => void;
}

export function useGooglePicker({ onFilePicked }: GooglePickerOptions) {
  const { user, isUserLoading } = useUser();
  const [gapiLoaded, setGapiLoaded] = useState(false);
  const [pickerApiLoaded, setPickerApiLoaded] = useState(false);
  const [oauthToken, setOauthToken] = useState<string | null>(null);
  const { toast } = useToast();

  // 1. Load the Google APIs scripts
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => setGapiLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google API script');
      setGapiLoaded(false);
      toast({
        variant: 'destructive',
        title: 'Google API Error',
        description: 'Failed to load Google Drive integration. Please check your internet connection and try again.',
      });
    };
    document.body.appendChild(script);

    return () => {
      // Only remove if the script exists in the DOM
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [toast]);

  // 2. Get the OAuth token from the currently signed-in user
  useEffect(() => {
    if (!user) {
        setOauthToken(null);
        return;
    };
    
    const auth = getAuth();
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
        if (currentUser) {
            const idToken = await currentUser.getIdToken();
            setOauthToken(idToken);
        } else {
            setOauthToken(null);
        }
    });

    return () => unsubscribe();
  }, [user]);

  // 3. Load the Picker API once gapi is ready
  useEffect(() => {
    if (gapiLoaded && window.gapi) {
      try {
        window.gapi.load('picker', { 
          'callback': () => setPickerApiLoaded(true)
        });
      } catch (error) {
        console.error('Error loading Google Picker API:', error);
        setPickerApiLoaded(false);
        toast({
          variant: 'destructive',
          title: 'Google Picker Error',
          description: 'Failed to initialize Google Drive picker. Please refresh the page and try again.',
        });
      }
    }
  }, [gapiLoaded, toast]);

  // The main function to open the picker
  const openPicker = useCallback(() => {
    try {
        if (!pickerApiLoaded || isUserLoading) {
            toast({ variant: 'destructive', title: 'Picker Not Ready', description: 'The Google Drive picker is still loading or user not signed in. Please try again in a moment.' });
            return;
        }
        
        if (!oauthToken) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'Could not get authentication token for Google Drive. Please sign in again.' });
            return;
        }

        // Ensure window.google and window.google.picker are available
        if (!window.google || !window.google.picker) {
            toast({ variant: 'destructive', title: 'Google Picker Error', description: 'Google Picker API is not loaded. Please refresh the page and try again.' });
            return;
        }

        const docsView = new (window.google.picker as any).View((window.google.picker as any).ViewId.DOCS)
            .setMimeTypes("application/vnd.google-apps.document");
            
        const picker = new (window.google.picker as any).PickerBuilder()
        .setAppId(APP_ID!)
        .setDeveloperKey(DEVELOPER_KEY!)
        .setOAuthToken(oauthToken)
        .addView(docsView)
        .setCallback(async (data: google.picker.ResponseObject) => {
            if (data.action === (window.google.picker as any).Action.PICKED) {
                // Safely check if docs array exists and has items
                if (!data.docs || !Array.isArray(data.docs) || data.docs.length === 0) {
                    toast({ 
                        variant: 'destructive', 
                        title: 'Import Failed', 
                        description: 'No document was selected or document data is missing.' 
                    });
                    return;
                }
                const doc = data.docs[0];
                if (!doc || !doc.id || !doc.name) {
                    toast({ 
                        variant: 'destructive', 
                        title: 'Import Failed', 
                        description: 'Selected document is missing required information.' 
                    });
                    return;
                }

                toast({ title: "Importing Document", description: `Fetching '${doc.name}' from Google Drive...`});
                
                try {
                    // Use server-side API to avoid CORS issues
                    const response = await fetch('/api/google-docs/get', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            documentId: doc.id,
                            accessToken: oauthToken,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch document from server');
                    }

                    const data = await response.json();
                    if (!data || !data.success) {
                        throw new Error(data?.error || 'Failed to fetch document');
                    }
                    
                    // Ensure document exists with valid structure
                    if (!data.document || typeof data.document !== 'object') {
                        throw new Error('Document data is missing or invalid');
                    }
                    
                    // Use the new import functionality to preserve formatting
                    try {
                        const scriptDoc = importFromGoogleDocs(data.document);
                        const formattedText = scriptDocumentToText(scriptDoc);
                        onFilePicked(doc.name, formattedText);
                    } catch (importError) {
                        // Fallback to plain text extraction if structured import fails
                        console.warn('Structured import failed, falling back to plain text:', importError);
                        const text = extractPlainTextFromGoogleDocs(data.document?.body?.content);
                        onFilePicked(doc.name, text);
                    }
                } catch (error: any) {
                    console.error("Error fetching document content:", error);
                    const errorMessage = error.message || 'Could not fetch document content. This may be due to incorrect API permissions in your Google Cloud project.';
                    toast({
                        variant: 'destructive',
                        title: 'Import Failed',
                        description: errorMessage,
                    });
                }
            }
        })
        .build();
        picker.setVisible(true);
    } catch (error: any) {
        console.error("Error creating or showing Google Picker:", error);
        toast({
            variant: 'destructive',
            title: 'Google Drive Error',
            description: "Could not open the Google Drive picker. This may be due to a configuration issue (e.g., popup blockers, invalid API key, or incorrect permissions in your Google Cloud project).",
        });
    }

  }, [pickerApiLoaded, isUserLoading, oauthToken, onFilePicked, toast]);

  return { openPicker, isPickerReady: pickerApiLoaded && !!oauthToken };
}
