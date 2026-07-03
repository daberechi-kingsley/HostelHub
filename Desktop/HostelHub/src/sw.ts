/**
 * HostelHub service worker — processed by Vite so import.meta.env works.
 *
 * Two jobs:
 *   1. Workbox precache + runtime caching (replaces the old generateSW config).
 *   2. Firebase Cloud Messaging background message handler — shows a native
 *      push notification when a chat message arrives while the app is closed.
 *
 * FCM is skipped when VITE_FCM_VAPID_KEY is blank (emulator / dev mode).
 */
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';

// ── 1. Workbox precache ───────────────────────────────────────────────────
// self.__WB_MANIFEST is replaced at build time by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// ── 2. Runtime caching rules (same as the old workbox config in vite.config) ─
registerRoute(
  ({ url }) =>
    url.hostname === 'firebasestorage.googleapis.com' &&
    /\.(png|jpg|jpeg|webp|avif)/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'listing-images',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  }),
);

registerRoute(
  ({ url }) => url.hostname === 'firestore.googleapis.com',
  new NetworkFirst({
    cacheName: 'firestore-reads',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }),
    ],
  }),
);

registerRoute(
  ({ url }) =>
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com'),
  new StaleWhileRevalidate({ cacheName: 'google-fonts' }),
);

// ── 3. Firebase Cloud Messaging ───────────────────────────────────────────
// Skip FCM setup when the VAPID key is absent (emulator / CI).
const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY as string | undefined;

if (vapidKey) {
  const firebaseApp = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });

  const messaging = getMessaging(firebaseApp);

  // Called when a push notification arrives while the app is backgrounded/closed.
  onBackgroundMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? 'New message — HostelHub';
    const body = payload.notification?.body ?? '';
    const chatId = payload.data?.chatId ?? '';

    return self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      // Replace duplicate notifications for the same chat thread
      tag: `chat-${chatId || 'general'}`,
      data: { url: chatId ? `/chat/${chatId}` : '/' },
    });
  });
}

// ── 4. Notification click → open / focus the app at the right URL ─────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl: string = (event.notification.data as { url?: string })?.url ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Focus an existing window if possible
        for (const client of clients) {
          if ('focus' in client) {
            return (client as WindowClient).focus();
          }
        }
        // Otherwise open a new tab
        return self.clients.openWindow(targetUrl);
      }),
  );
});
