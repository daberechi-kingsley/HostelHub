import { useEffect, useState } from 'react';

/**
 * Fires the "You're verified!" celebration exactly once, the first time a given
 * user is seen as verified. A localStorage flag keyed by uid makes it durable
 * across refreshes and later visits, so the confetti never replays.
 *
 * Returns { celebrate, dismiss }:
 *   • celebrate — true while the celebration should be on screen.
 *   • dismiss   — call when the animation finishes to hide it.
 */
export function useVerifiedCelebration(uid: string | undefined, verified: boolean) {
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!uid || !verified) return;
    const key = `hh-verified-celebrated-${uid}`;
    if (localStorage.getItem(key)) return; // already celebrated for this user
    localStorage.setItem(key, '1');
    setCelebrate(true);
  }, [uid, verified]);

  return { celebrate, dismiss: () => setCelebrate(false) };
}
