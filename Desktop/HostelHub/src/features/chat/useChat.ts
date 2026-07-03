/**
 * Real-time hook for a single chat thread.
 *
 * Subscribes to RTDB messages and the other participant's typing indicator.
 * Exposes `sendMessage` and `notifyTyping` (debounced auto-clear) to the UI.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { sendMessage as sendMessageApi, subscribeMessages, setTyping, subscribeTyping } from './api';
import type { ChatMessage } from '@/types/chat';

const TYPING_RESET_MS = 1_500;

export function useChat(chatId: string, otherUid: string) {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid ?? '';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherTyping, setOtherTyping] = useState(false);
  const [sending, setSending] = useState(false);

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to messages
  useEffect(() => {
    if (!chatId) return;
    return subscribeMessages(chatId, setMessages);
  }, [chatId]);

  // Subscribe to the other person's typing indicator
  useEffect(() => {
    if (!chatId || !otherUid) return;
    return subscribeTyping(chatId, otherUid, setOtherTyping);
  }, [chatId, otherUid]);

  // Clear own typing indicator and timer on unmount
  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (uid && chatId) void setTyping(chatId, uid, false);
    };
  }, [chatId, uid]);

  /** Call on every keystroke — sets typing=true, resets the auto-clear timer. */
  const notifyTyping = useCallback(() => {
    if (!uid || !chatId) return;
    void setTyping(chatId, uid, true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      void setTyping(chatId, uid, false);
    }, TYPING_RESET_MS);
  }, [chatId, uid]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!uid || !text.trim()) return;
      setSending(true);
      // Clear typing immediately on send
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      void setTyping(chatId, uid, false);
      try {
        await sendMessageApi(chatId, uid, text);
      } finally {
        setSending(false);
      }
    },
    [chatId, uid],
  );

  return { messages, otherTyping, sendMessage, notifyTyping, sending };
}
