import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { createUserDoc } from '@/lib/firebase/auth';
import { ADMIN_EMAILS } from '@/config/constants';
import type { AppUser, UserRole } from '@/types/user';

export interface AuthState {
  /** The raw Firebase auth user (uid, phone, displayName, etc.) — null when signed out. */
  firebaseUser: FirebaseUser | null;
  /** The HostelHub user doc (role, verified, etc.) — null when signed out OR before first-sign-in role pick. */
  appUser: AppUser | null;
  /** True while we're determining auth state on app boot. */
  loading: boolean;
  /** True if signed in but no role yet (needs RoleSelection). */
  needsRoleSelection: boolean;
  /** Re-fetch the user doc — call after creating it in RoleSelection. */
  refreshAppUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  firebaseUser: null,
  appUser: null,
  loading: true,
  needsRoleSelection: false,
  refreshAppUser: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUserRef = useRef<FirebaseUser | null>(null);

  /** Load the users/{uid} doc for a given Firebase user into appUser state. */
  const loadAppUser = useCallback(async (user: FirebaseUser | null) => {
    if (!user) {
      setAppUser(null);
      return;
    }
    try {
      const snap = await getDoc(doc(getFirebaseDb(), 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        const role = data.role as UserRole;
        // A stale role:'admin' doc for a non-admin email must not silently grant
        // admin powers — treat it as no-doc so the role picker shows and overwrites it.
        if (role === 'admin' && !ADMIN_EMAILS.includes(user.email ?? '')) {
          setAppUser(null);
          return;
        }
        setAppUser({
          uid: user.uid,
          role,
          displayName: data.displayName ?? user.displayName ?? '',
          phone: data.phone ?? user.phoneNumber ?? undefined,
          email: data.email ?? user.email ?? undefined,
          avatarUrl: data.avatarUrl ?? user.photoURL ?? undefined,
          bio: data.bio ?? undefined,
          verified: Boolean(data.verified),
          createdAt: data.createdAt ?? Date.now(),
          fcmTokens: data.fcmTokens,
        });
      } else {
        // First sign-in — no user doc yet. For Google/phone users, auto-create
        // with role 'student' so the RoleSelection modal never flashes.
        const provider = user.providerData[0]?.providerId;
        if (provider === 'google.com' || provider === 'phone') {
          const role = 'student' as const;
          await createUserDoc({
            uid: user.uid,
            role,
            displayName: user.displayName ?? 'New user',
            phone: user.phoneNumber ?? undefined,
            email: user.email ?? undefined,
            avatarUrl: user.photoURL ?? undefined,
          });
          setAppUser({
            uid: user.uid,
            role,
            displayName: user.displayName ?? 'New user',
            phone: user.phoneNumber ?? undefined,
            email: user.email ?? undefined,
            avatarUrl: user.photoURL ?? undefined,
            verified: false,
            createdAt: Date.now(),
            fcmTokens: [],
          });
        } else {
          setAppUser(null);
        }
      }
    } catch (err) {
      console.error('[AuthProvider] failed to load user doc', err);
      setAppUser(null);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (user) => {
      currentUserRef.current = user;
      setLoading(true);
      setFirebaseUser(user);
      await loadAppUser(user);
      setLoading(false);
    });
    return () => unsub();
  }, [loadAppUser]);

  const refreshAppUser = useCallback(async () => {
    await loadAppUser(currentUserRef.current);
  }, [loadAppUser]);

  const needsRoleSelection = Boolean(firebaseUser && !appUser && !loading);

  return (
    <AuthContext.Provider
      value={{ firebaseUser, appUser, loading, needsRoleSelection, refreshAppUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
