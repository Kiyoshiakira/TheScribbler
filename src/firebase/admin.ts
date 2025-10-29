import * as admin from 'firebase-admin';
import { firebaseConfig } from '@/firebase/config';

// IMPORTANT: This file should only be used in server-side code.
// It initializes the Firebase Admin SDK, which has elevated privileges.

let adminApp: admin.app.App;

const serviceAccount = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT)
  : undefined;

if (admin.apps.length > 0) {
  adminApp = admin.apps[0]!;
} else if (serviceAccount) {
  adminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`,
    storageBucket: `${firebaseConfig.projectId}.appspot.com`,
  });
} else {
  console.warn("Firebase Admin SDK service account credentials are not set. Admin features will be unavailable.");
  // We don't initialize a dummy app anymore as it causes crashes.
  // The app will run, but any function calling getFirestore(adminApp) or getAuth(adminApp) will fail
  // if adminApp is not initialized. We handle this gracefully in the actions.
}

// We cannot safely export adminApp if it might not be initialized.
// Instead, functions that need it should import it directly from this module.
export { adminApp };
