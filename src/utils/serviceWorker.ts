/**
 * Service Worker Registration Utility
 * 
 * Handles registration and lifecycle management of the service worker
 */

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onOffline?: () => void;
  onOnline?: () => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[ServiceWorker] Service workers are not supported');
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[ServiceWorker] Registered successfully:', registration.scope);

        // Check for updates
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) {
            return;
          }

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New update available
                console.log('[ServiceWorker] New content is available; please refresh.');
                if (config?.onUpdate) {
                  config.onUpdate(registration);
                }
              } else {
                // Content cached for offline use
                console.log('[ServiceWorker] Content is cached for offline use.');
                if (config?.onSuccess) {
                  config.onSuccess(registration);
                }
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('[ServiceWorker] Registration failed:', error);
      });
  });

  // Listen for online/offline events
  window.addEventListener('online', () => {
    console.log('[ServiceWorker] Browser is online');
    if (config?.onOnline) {
      config.onOnline();
    }
  });

  window.addEventListener('offline', () => {
    console.log('[ServiceWorker] Browser is offline');
    if (config?.onOffline) {
      config.onOffline();
    }
  });
}

export function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  navigator.serviceWorker.ready
    .then((registration) => {
      registration.unregister();
    })
    .catch((error) => {
      console.error('[ServiceWorker] Unregistration failed:', error);
    });
}
