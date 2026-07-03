/**
 * Hook that initiates or resumes a chat thread for a listing.
 *
 * Resolves the counterpart (concierge or direct) from Firestore config,
 * creates the RTDB thread if it doesn't exist, then navigates to /chat/{chatId}.
 *
 * Usage:
 *   const { startChat, starting } = useStartChat();
 *   onClick={() => require('contact', () => startChat(listing.id, listing.title))}
 */
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/hooks/useUser';
import { resolveCounterpart, buildChatId } from './chatUtils';
import { createOrGetChat } from './api';

export function useStartChat() {
  const { firebaseUser } = useUser();
  const navigate = useNavigate();
  const [starting, setStarting] = useState(false);

  const startChat = useCallback(
    async (listingId: string, listingTitle: string) => {
      if (!firebaseUser) return;
      setStarting(true);
      try {
        const { counterpartUid, mode } = await resolveCounterpart(listingId);

        if (!counterpartUid) {
          console.warn('[startChat] no counterpart for listing', listingId);
          return;
        }

        const chatId = buildChatId(firebaseUser.uid, counterpartUid, listingId);

        await createOrGetChat(chatId, {
          participants: {
            [firebaseUser.uid]: true,
            [counterpartUid]: true,
          },
          listingId,
          listingTitle,
          mode,
          createdAt: Date.now(),
          lastMessage: '',
          lastMessageTs: 0,
        });

        navigate(`/chat/${chatId}`);
      } catch (err) {
        console.error('[startChat] failed', err);
      } finally {
        setStarting(false);
      }
    },
    [firebaseUser, navigate],
  );

  return { startChat, starting };
}
