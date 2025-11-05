export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export function isFirebaseConfigValid(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

export function getFirebaseConfigError(): string | null {
  if (!firebaseConfig.apiKey) {
    return 'Firebase API Key is missing. Please set NEXT_PUBLIC_FIREBASE_API_KEY in your .env.local file.';
  }
  if (!firebaseConfig.authDomain) {
    return 'Firebase Auth Domain is missing. Please set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN in your .env.local file.';
  }
  if (!firebaseConfig.projectId) {
    return 'Firebase Project ID is missing. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in your .env.local file.';
  }
  if (!firebaseConfig.appId) {
    return 'Firebase App ID is missing. Please set NEXT_PUBLIC_FIREBASE_APP_ID in your .env.local file.';
  }
  return null;
}
