/**
 * Open (or resume) a peer-to-peer chat that is NOT tied to a listing.
 * Used by the roommate matching feature.
 *
 * Chat ID: sorted [uid1, uid2].join('_')  — deterministic, deduped, O(1).
 * Meta is created with type='roommate' and mode='direct' so the ChatThreadPage
 * renders without needing a listing reference.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { getFirebaseRtdb } from '@/lib/firebase';
import { useUser } from '@/hooks/useUser';

export function useStartDirectChat() {
  const { firebaseUser } = useUser();
  const navigate  = useNavigate();
  const [starting, setStarting] = useState(false);

  async function startDirectChat(targetUid: string, displayName: string) {
    if (!firebaseUser) return;
    setStarting(true);
    try {
      // Deterministic, sorted so uid_A + uid_B always yields the same ID
      const pair   = [firebaseUser.uid, targetUid].sort();
      const chatId = pair.join('_');
      const db     = getFirebaseRtdb();
      const metaRef = ref(db, `chats/${chatId}/meta`);
      const snap    = await get(metaRef);

      if (!snap.exists()) {
        await set(metaRef, {
          participants: { [pair[0]!]: true, [pair[1]!]: true },
          listingTitle: `Chat with ${displayName}`,
          listingId:    null,
          mode:         'direct',
          type:         'roommate',
          createdAt:    Date.now(),
        });
      }

      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error('[useStartDirectChat]', err);
    } finally {
      setStarting(false);
    }
  }

  return { startDirectChat, starting };
}
