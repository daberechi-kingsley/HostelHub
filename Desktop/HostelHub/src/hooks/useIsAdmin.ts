import { useUser } from '@/hooks/useUser';
import { ADMIN_EMAILS } from '@/config/constants';

/**
 * True when the current user has admin powers.
 *
 * Admin is granted two ways:
 *   1. Their HostelHub user doc has role === 'admin'.
 *   2. Their Firebase Auth email is in ADMIN_EMAILS (founder bootstrap).
 *
 * The same logic is mirrored in firestore.rules / storage.rules so the UI
 * gate and the server-side gate always agree.
 */
export function useIsAdmin(): boolean {
  const { firebaseUser } = useUser();
  // Admin is determined solely by email — a stale role:'admin' in Firestore
  // must never grant admin powers to a non-admin email.
  const email = firebaseUser?.email;
  return Boolean(email && ADMIN_EMAILS.includes(email));
}
