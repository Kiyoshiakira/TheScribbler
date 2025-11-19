'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase';
import { useToast } from './use-toast';
import { getAuth, onIdTokenChanged } from 'firebase/auth';
import { importFromGoogleDocs, scriptDocumentToText } from '@/lib/import-google-docs';

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
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

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
    if (gapiLoaded) {
      window.gapi.load('picker', { 'callback': () => setPickerApiLoaded(true) });
    }
  }, [gapiLoaded]);

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

        const docsView = new (window.google.picker as any).View((window.google.picker as any).ViewId.DOCS)
            .setMimeTypes("application/vnd.google-apps.document");
            
        const picker = new (window.google.picker as any).PickerBuilder()
        .setAppId(APP_ID!)
        .setDeveloperKey(DEVELOPER_KEY!)
        .setOAuthToken(oauthToken)
        .addView(docsView)
        .setCallback(async (data: google.picker.ResponseObject) => {
            if (data.action === (window.google.picker as any).Action.PICKED) {
                const doc = data.docs[0];
                if (!doc) return;

                toast({ title: "Importing Document", description: `Fetching '${doc.name}' from Google Drive...`});
                
                try {
                    await window.gapi.client.load('https://docs.googleapis.com/$discovery/rest?version=v1');
                    const response = await (window.gapi.client as any).docs.documents.get({
                        documentId: doc.id
                    });
                    
                    // Use the new import functionality to preserve formatting
                    try {
                        const scriptDoc = importFromGoogleDocs(response.result);
                        const formattedText = scriptDocumentToText(scriptDoc);
                        onFilePicked(doc.name, formattedText);
                    } catch (importError) {
                        // Fallback to plain text extraction if structured import fails
                        console.warn('Structured import failed, falling back to plain text:', importError);
                        const content = response.result.body.content;
                        let text = '';
                        if(content){
                            content.forEach((p: { paragraph?: { elements?: Array<{ textRun?: { content?: string } }> } }) => {
                                if (p.paragraph && p.paragraph.elements) {
                                    p.paragraph.elements.forEach((elem: { textRun?: { content?: string } }) => {
                                        if(elem.textRun && elem.textRun.content){
                                            text += elem.textRun.content;
                                        }
                                    })
                                }
                            })
                        }
                        onFilePicked(doc.name, text);
                    }
                } catch (error: any) {
                    console.error("Error fetching document content:", error);
                    const errorMessage = error.result?.error?.message || 'Could not fetch document content. This may be due to incorrect API permissions in your Google Cloud project.';
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
