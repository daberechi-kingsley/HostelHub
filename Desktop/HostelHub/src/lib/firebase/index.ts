/**
 * Firebase client SDK initialization for HostelHub.
 *
 * Strategy:
 *   - Single FirebaseApp instance, lazily created on first use.
 *   - VITE_USE_EMULATORS=true  → all services point at localhost emulators.
 *   - VITE_USE_EMULATORS=false → real Firebase project (production / staging).
 *
 * Vite HMR re-evaluates modules on every file save, resetting module-level
 * vars to null.  globalThis persists across re-evaluations, so we cache every
 * instance there.  In production only one evaluation ever occurs — no overhead.
 */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  connectFirestoreEmulator,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, connectStorageEmulator, type FirebaseStorage } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator, type Database } from 'firebase/database';
import { env, isFirebaseConfigured } from '@/config/env';

const EMULATOR_HOST = 'localhost';
const EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  storage: 9199,
  database: 9000,
  functions: 5001,
} as const;

// ─── globalThis cache (survives Vite HMR) ───────────────────────────────────
const _g = globalThis as Record<string, unknown>;

let app: FirebaseApp | null = (_g.__hh_app as FirebaseApp) ?? null;
let authInstance: Auth | null = (_g.__hh_auth as Auth) ?? null;
let dbInstance: Firestore | null = (_g.__hh_db as Firestore) ?? null;
let storageInstance: FirebaseStorage | null = (_g.__hh_storage as FirebaseStorage) ?? null;
let rtdbInstance: Database | null = (_g.__hh_rtdb as Database) ?? null;

function ensureApp(): FirebaseApp {
  if (app) return app;
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase env vars are missing. Copy .env.example to .env.local and fill in values.',
    );
  }
  const existing = getApps();
  app = existing.length > 0 ? existing[0]! : initializeApp(env.firebase);
  _g.__hh_app = app;
  return app;
}

/** Public getter — used by the Functions SDK wrapper (src/lib/firebase/functions.ts). */
export function getFirebaseApp(): FirebaseApp {
  return ensureApp();
}

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;
  authInstance = getAuth(ensureApp());
  _g.__hh_auth = authInstance;
  if (env.useEmulators) {
    connectAuthEmulator(authInstance, `http://${EMULATOR_HOST}:${EMULATOR_PORTS.auth}`, {
      disableWarnings: true,
    });
  }
  return authInstance;
}

export function getFirebaseDb(): Firestore {
  if (dbInstance) return dbInstance;
  // initializeFirestore (vs getFirestore) lets us configure multi-tab persistence
  // before any other Firestore call — required for offline browsing of cached listings.
  dbInstance = initializeFirestore(ensureApp(), {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  _g.__hh_db = dbInstance;
  if (env.useEmulators) {
    connectFirestoreEmulator(dbInstance, EMULATOR_HOST, EMULATOR_PORTS.firestore);
  }
  return dbInstance;
}

export function getFirebaseStorage(): FirebaseStorage {
  if (storageInstance) return storageInstance;
  storageInstance = getStorage(ensureApp());
  _g.__hh_storage = storageInstance;
  if (env.useEmulators) {
    connectStorageEmulator(storageInstance, EMULATOR_HOST, EMULATOR_PORTS.storage);
  }
  return storageInstance;
}

export function getFirebaseRtdb(): Database {
  if (rtdbInstance) return rtdbInstance;
  rtdbInstance = getDatabase(ensureApp());
  _g.__hh_rtdb = rtdbInstance;
  if (env.useEmulators) {
    connectDatabaseEmulator(rtdbInstance, EMULATOR_HOST, EMULATOR_PORTS.database);
  }
  return rtdbInstance;
}

export { env, EMULATOR_PORTS };
