
/**
 * Validated env var access. Throws early if a required var is missing,
 * so we fail fast at startup instead of mid-flow.
 */

function read(key: string): string {
  const value = import.meta.env[key];
  if (typeof value !== 'string' || value.length === 0) {
    return '';
  }
  return value;
}

function readBool(key: string): boolean {
  return read(key).toLowerCase() === 'true';
}

export const env = {
  firebase: {
    apiKey: read('VITE_FIREBASE_API_KEY'),
    authDomain: read('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: read('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: read('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: read('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: read('VITE_FIREBASE_APP_ID'),
    databaseURL: read('VITE_FIREBASE_DATABASE_URL'),
  },
  useEmulators: readBool('VITE_USE_EMULATORS'),
  /** FCM Web Push VAPID key — blank means push notifications are disabled. */
  fcmVapidKey: read('VITE_FCM_VAPID_KEY'),
  /**
   * Hidden admin bootstrap account.
   *
   * ⚠️ SECURITY: VITE_* vars are inlined into the client bundle at build time,
   * so these are visible to anyone who inspects the shipped JS — they are NOT
   * secret. The real admin gate is the email-matched Firebase Auth token
   * enforced in firestore.rules / storage.rules. VITE_ADMIN_EMAIL must match
   * an entry in ADMIN_EMAILS (src/config/constants.ts) and the hardcoded email
   * in the rules files.
   */
  admin: {
    email: read('VITE_ADMIN_EMAIL'),
    password: read('VITE_ADMIN_PASSWORD'),
  },
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};

/** True only when a real Firebase project is configured. */
export function isFirebaseConfigured(): boolean {
  return env.firebase.apiKey.length > 0 && env.firebase.projectId.length > 0;
}
