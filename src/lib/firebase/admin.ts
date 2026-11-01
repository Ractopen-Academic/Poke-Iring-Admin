import "server-only";
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

function formatPrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let formatted = key.trim();
  // Strip enclosing quotes if present from dotenv copy-paste
  if (
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("'") && formatted.endsWith("'"))
  ) {
    formatted = formatted.slice(1, -1);
  }
  return formatted.replace(/\\n/g, "\n");
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}

function initializeFirebaseAdmin(): App | null {
  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      return getApp();
    }

    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = formatPrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
    const storageBucket =
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
      (projectId ? `${projectId}.firebasestorage.app` : undefined);

    if (projectId && clientEmail && privateKey) {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        ...(storageBucket ? { storageBucket } : {}),
      });
    }

    // If in cloud environment with default credentials
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.K_SERVICE) {
      return initializeApp(storageBucket ? { storageBucket } : undefined);
    }

    return null;
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    return null;
  }
}

let appInstance: App | null = null;
try {
  appInstance = initializeFirebaseAdmin();
} catch (err) {
  console.error("Failed to execute initializeFirebaseAdmin:", err);
  appInstance = null;
}

export const adminApp = appInstance;
export const adminDb = appInstance
  ? getFirestore(appInstance)
  : (null as unknown as Firestore);
export const adminStorage: Storage | null = appInstance
  ? getStorage(appInstance)
  : null;

export function getAdminStorageBucket() {
  if (!adminStorage) return null;
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    (projectId ? `${projectId}.firebasestorage.app` : undefined);
  try {
    return bucketName ? adminStorage.bucket(bucketName) : adminStorage.bucket();
  } catch {
    return null;
  }
}
