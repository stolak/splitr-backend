import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

let firebaseApp: admin.app.App | null = null;

function normalizePrivateKey(rawKey: string): string {
  let key = rawKey.trim();

  // Common .env mistake: extra wrapping quotes around the whole key value.
  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  key = key.replace(/\\n/g, '\n');
  key = key.replace(/,\s*$/, '').trim();

  return key;
}

function getFirebaseCredentials() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const parsed = JSON.parse(serviceAccountJson);
    if (typeof parsed.private_key === 'string') {
      parsed.private_key = normalizePrivateKey(parsed.private_key);
    }
    return parsed;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY)
    : undefined;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
    );
  }

  if (!privateKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error(
      'FIREBASE_PRIVATE_KEY is malformed. Use escaped newlines (\\n) and avoid extra quotes around the key.',
    );
  }

  return { projectId, clientEmail, privateKey };
}

export function getFirebaseApp(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(getFirebaseCredentials()),
  });
  return firebaseApp;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  const app = getFirebaseApp();
  return app.auth().verifyIdToken(idToken);
}
