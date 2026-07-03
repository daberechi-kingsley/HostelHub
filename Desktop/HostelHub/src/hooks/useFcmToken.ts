/**
 * Registers the device's FCM token whenever the user signs in, and handles
 * foreground push messages (app is open) by surfacing them as browser
 * Notification API calls.
 *
 * Runs as a side-effect inside RootLayout — no UI rendered.
 *
 * Token lifecycle:
 *   • Requested once per sign-in session (idempotent: arrayUnion skips dupes).
 *   • Stale tokens are cleaned up server-side when a send fails (functions/src/index.ts).
 *   • Re-requested on next sign-in if the previous token was purged.
 */
import { useEffect } from 'react';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { useUser } from '@/hooks/useUser';
import { getFirebaseDb } from '@/lib/firebase';
import { onForegroundMessage, requestAndGetFcmToken } from '@/lib/firebase/messaging';

export function useFcmToken(): void {
  const { firebaseUser, isSignedIn } = useUser();
  const uid = firebaseUser?.uid;

  // ── Token registration ────────────────────────────────────────────────
  useEffect(() => {
    if (!isSignedIn || !uid) return;

    let cancelled = false;

    void (async () => {
      const token = await requestAndGetFcmToken();
      if (!token || cancelled) return;

      try {
        await updateDoc(doc(getFirebaseDb(), 'users', uid), {
          fcmTokens: arrayUnion(token),
        });
      } catch (err) {
        // Non-fatal — push will still work; token just won't be saved until next sign-in
        console.warn('[FCM] token save failed:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, isSignedIn]);

  // ── Foreground message handler ────────────────────────────────────────
  // When the app is open, FCM doesn't show a system notification automatically.
  // We use the Notification API ourselves so the user still gets an alert.
  useEffect(() => {
    const unsub = onForegroundMessage((payload) => {
      // Only show if the user hasn't suppressed notifications
      if (Notification.permission !== 'granted') return;

      const title = payload.notification?.title ?? 'New message — HostelHub';
      const body = payload.notification?.body ?? '';
      const chatId = payload.data?.chatId ?? '';

      // Clicking the notification navigates to the chat (handled by SW notificationclick
      // for background; for foreground we use a regular Notification).
      const n = new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
        tag: `chat-${chatId || 'general'}`,
      });

      if (chatId) {
        n.onclick = () => {
          window.focus();
          window.location.href = `/chat/${chatId}`;
        };
      }
    });

    return unsub;
  }, []); // no deps — messaging instance is stable
}
