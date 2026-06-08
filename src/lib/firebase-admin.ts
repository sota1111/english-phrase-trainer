import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (getApps().length === 0) {
  app = initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
} else {
  app = getApps()[0];
}

export const db = getFirestore(app);
