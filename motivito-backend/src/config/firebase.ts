import admin from 'firebase-admin';
import { env } from './env';

let firebaseApp: admin.app.App | null = null;

export function initFirebase() {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
    console.warn('⚠️ Firebase not configured - FCM notifications disabled');
    return;
  }

  if (admin.apps.length === 0) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin initialized');
  }
}

export function getFirebaseAdmin() {
  return firebaseApp ? admin : null;
}
