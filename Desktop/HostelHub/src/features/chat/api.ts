/**
 * Realtime Database operations for the chat feature.
 *
 * RTDB structure:
 *   chats/{chatId}/meta          — ChatMeta (participants as obj, listingId, mode…)
 *   chats/{chatId}/messages/{id} — ChatMessage
 *   chats/{chatId}/typing/{uid}  — boolean
 *   userChats/{uid}/{chatId}     — true (reverse index so we can list a user's threads)
 */
import {
  ref,
  push,
  set,
  get,
  update,
  onValue,
  query as rtdbQuery,
  orderByChild,
  limitToLast,
  type Unsubscribe,
} from 'firebase/database';
import { getFirebaseRtdb } from '@/lib/firebase';
import type { ChatMessage, ChatMeta } from '@/types/chat';

const rtdb = () => getFirebaseRtdb();

// ── Messages ──────────────────────────────────────────────────────────────────

export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string,
): Promise<void> {
  const db = rtdb();
  const trimmed = text.trim();
  const ts = Date.now();

  // Push message
  await push(ref(db, `chats/${chatId}/messages`), {
    senderId,
    text: trimmed,
    ts,
    read: false,
  });

  // Keep last-message preview in meta for the chat list
  await update(ref(db, `chats/${chatId}/meta`), {
    lastMessage: trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed,
    lastMessageTs: ts,
  });
}

export function subscribeMessages(
  chatId: string,
  cb: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const db = rtdb();
  const q = rtdbQuery(
    ref(db, `chats/${chatId}/messages`),
    orderByChild('ts'),
    limitToLast(50),
  );

  return onValue(q, (snap) => {
    const msgs: ChatMessage[] = [];
    snap.forEach((child) => {
      msgs.push({ id: child.key!, ...(child.val() as Omit<ChatMessage, 'id'>) });
    });
    cb(msgs);
  });
}

// ── Typing indicators ─────────────────────────────────────────────────────────

export async function setTyping(
  chatId: string,
  uid: string,
  isTyping: boolean,
): Promise<void> {
  await set(ref(rtdb(), `chats/${chatId}/typing/${uid}`), isTyping);
}

export function subscribeTyping(
  chatId: string,
  otherUid: string,
  cb: (isTyping: boolean) => void,
): Unsubscribe {
  return onValue(ref(rtdb(), `chats/${chatId}/typing/${otherUid}`), (snap) => {
    cb(snap.val() === true);
  });
}

// ── Chat meta + creation ──────────────────────────────────────────────────────

/**
 * Creates the chat in RTDB if it doesn't already exist, then writes both
 * participants' userChats index entries so each user can list their threads.
 */
export async function createOrGetChat(chatId: string, meta: ChatMeta): Promise<void> {
  const db = rtdb();
  const metaRef = ref(db, `chats/${chatId}/meta`);
  const snap = await get(metaRef);

  if (snap.exists()) return; // thread already open — nothing to do

  // Atomic multi-path write: meta + both sides of the userChats index
  const updates: Record<string, unknown> = {
    [`chats/${chatId}/meta`]: meta,
  };
  for (const uid of Object.keys(meta.participants)) {
    updates[`userChats/${uid}/${chatId}`] = true;
  }
  await update(ref(db), updates);
}

export function subscribeChatMeta(
  chatId: string,
  cb: (meta: ChatMeta | null) => void,
): Unsubscribe {
  return onValue(ref(rtdb(), `chats/${chatId}/meta`), (snap) => {
    cb(snap.exists() ? (snap.val() as ChatMeta) : null);
  });
}

// ── User chat index ───────────────────────────────────────────────────────────

export function subscribeUserChatIds(
  uid: string,
  cb: (chatIds: string[]) => void,
): Unsubscribe {
  return onValue(ref(rtdb(), `userChats/${uid}`), (snap) => {
    if (!snap.exists()) {
      cb([]);
      return;
    }
    cb(Object.keys(snap.val() as Record<string, boolean>));
  });
}
