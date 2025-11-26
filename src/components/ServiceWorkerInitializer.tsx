/**
 * Service Worker Initializer
 * 
 * Client component that registers the service worker on mount
 */

'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/utils/serviceWorker';
import { useToast } from '@/hooks/use-toast';

export function ServiceWorkerInitializer() {
  const { toast } = useToast();

  useEffect(() => {
    // Only register service worker in production
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker({
        onSuccess: () => {
          console.log('[ServiceWorker] Content is cached for offline use');
        },
        onUpdate: () => {
          toast({
            title: 'Update Available',
            description: 'A new version is available. Please refresh to update.',
            duration: 10000,
          });
        },
        onOffline: () => {
          toast({
            title: 'Offline',
            description: 'You are now offline. Your changes will be saved locally.',
            variant: 'default',
          });
        },
        onOnline: () => {
          toast({
            title: 'Online',
            description: 'You are back online. Your changes will sync automatically.',
            variant: 'default',
          });
        },
      });
    }
  }, [toast]);

  return null;
}
