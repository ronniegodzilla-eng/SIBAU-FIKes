// Firebase Admin SDK — HANYA boleh diimpor dari API Routes (server). Punya
// akses penuh ke Firestore & Auth (bypass security rules), jadi semua WRITE
// aplikasi wajib lewat modul ini.

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

function initAdminApp(): App {
  if (getApps().length) return getApps()[0]!;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_KEY belum diset di environment variables server.'
    );
  }

  const serviceAccount = JSON.parse(raw);
  // Private key di env var biasanya berisi literal "\n" — perlu di-unescape.
  if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(
      /\\n/g,
      '\n'
    );
  }

  return initializeApp({
    credential: cert(serviceAccount),
  });
}

const adminApp = initAdminApp();

export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export default adminApp;
