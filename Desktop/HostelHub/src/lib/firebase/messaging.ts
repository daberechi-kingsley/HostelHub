/**
 * Firebase Cloud Messaging client wrapper.
 *
 * FCM has no emulator — all functions return null/no-op when:
 *   • VITE_USE_EMULATORS=true  (local dev)
 *   • VITE_FCM_VAPID_KEY is blank  (CI / pre-production)
 *   • The browser doesn't support service workers
 *
 * Callers should always guard on the null return before using the instance.
 */
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from 'firebase/messaging';
import { getFirebaseApp } from '@/lib/firebase';
import { env } from '@/config/env';

let messagingInstance: Messaging | null = null;

/**
 * Returns the Messaging instance, or null when FCM is not available/configured.
 * Cached after first call.
 */
export function getFirebaseMessaging(): Messaging | null {
  // FCM is unavailable in emulator mode and when the VAPID key is absent
  if (env.useEmulators || !env.fcmVapidKey) return null;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  if (messagingInstance) return messagingInstance;
  messagingInstance = getMessaging(getFirebaseApp());
  return messagingInstance;
}

/**
 * Requests Notification permission, then returns the FCM registration token.
 * Returns null if permission is denied, FCM is unavailable, or getToken fails.
 */
export async function requestAndGetFcmToken(): Promise<string | null> {
  const messaging = getFirebaseMessaging();
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    // Wait for the service worker controlling this page to be ready
    const swReg = await navigator.serviceWorker.ready;

    return await getToken(messaging, {
      vapidKey: env.fcmVapidKey,
      serviceWorkerRegistration: swReg,
    });
  } catch (err) {
    console.warn('[FCM] getToken failed — push notifications unavailable:', err);
    return null;
  }
}

/**
 * Subscribe to foreground messages (app is open and focused).
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(
  handler: (payload: MessagePayload) => void,
): () => void {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};
  return onMessage(messaging, handler);
}
