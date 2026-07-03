import { useAuthModalStore, type AuthGate } from '@/stores/authModalStore';
import { useUser } from '@/hooks/useUser';

/**
 * Gate any action that requires sign-in. If the user is signed in, run `onAuthed`
 * (or just return true). Otherwise, open the lazy-auth modal with the right copy
 * for the gate (`contact` | `save` | `visit` | `book`) and return false so the
 * caller knows the action did not run.
 *
 * Usage:
 *   const { require } = useLazyAuth();
 *   <button onClick={() => require('contact', startChat)}>Contact</button>
 */
export function useLazyAuth() {
  const show = useAuthModalStore((s) => s.show);
  const { isSignedIn } = useUser();

  return {
    isSignedIn,
    require(gate: Exclude<AuthGate, null>, onAuthed?: () => void): boolean {
      if (isSignedIn) {
        onAuthed?.();
        return true;
      }
      show(gate);
      return false;
    },
  };
}
