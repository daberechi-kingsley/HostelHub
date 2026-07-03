import { useContext } from 'react';
import { AuthContext } from '@/app/providers/AuthProvider';

/**
 * Read the current user + auth state from anywhere in the tree.
 *
 *   const { firebaseUser, appUser, loading, isSignedIn, needsRoleSelection } = useUser();
 *
 * `isSignedIn` requires BOTH a Firebase auth user AND a HostelHub user doc with a role.
 * If `firebaseUser` exists but `appUser` doesn't, the user has signed in for the first
 * time and needs to pick a role (student / landlord / agent) — handled in RoleSelection.
 */
export function useUser() {
  const ctx = useContext(AuthContext);
  return {
    ...ctx,
    isSignedIn: Boolean(ctx.firebaseUser && ctx.appUser),
  };
}
