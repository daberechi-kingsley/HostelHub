/**
 * Subscribes to the current user's chat threads, sorted newest-first.
 *
 * Strategy:
 *   1. Subscribe to `userChats/{uid}` for the list of chatIds.
 *   2. For each chatId, subscribe to `chats/{chatId}/meta`.
 *   3. Re-sort and surface as `threads` whenever any meta updates.
 */
import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { subscribeUserChatIds, subscribeChatMeta } from './api';
import type { ChatThread } from '@/types/chat';

export function useChatList() {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid ?? '';

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const metaUnsubs: (() => void)[] = [];
    let active = true;
    const threadMap = new Map<string, ChatThread>();

    function recompute() {
      if (!active) return;
      setThreads(
        [...threadMap.values()].sort(
          (a, b) => (b.meta.lastMessageTs ?? 0) - (a.meta.lastMessageTs ?? 0),
        ),
      );
      setLoading(false);
    }

    const indexUnsub = subscribeUserChatIds(uid, (chatIds) => {
      // Tear down old meta subscriptions
      metaUnsubs.forEach((u) => u());
      metaUnsubs.length = 0;

      if (chatIds.length === 0) {
        // Genuinely empty — clear immediately
        threadMap.clear();
        setThreads([]);
        setLoading(false);
        return;
      }

      // Don't clear threadMap here — keep stale data visible while fresh meta loads.
      // Remove any chatIds that are no longer in the index.
      const newIdSet = new Set(chatIds);
      for (const staleId of [...threadMap.keys()]) {
        if (!newIdSet.has(staleId)) threadMap.delete(staleId);
      }

      for (const chatId of chatIds) {
        const u = subscribeChatMeta(chatId, (meta) => {
          if (meta) {
            threadMap.set(chatId, { chatId, meta });
          } else {
            threadMap.delete(chatId);
          }
          recompute();
        });
        metaUnsubs.push(u);
      }
    });

    return () => {
      active = false;
      indexUnsub();
      metaUnsubs.forEach((u) => u());
    };
  }, [uid]);

  return { threads, loading };
}
