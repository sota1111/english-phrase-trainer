import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let app: App;

if (getApps().length === 0) {
  app = initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
export const adminAuth = getAuth(app);
