export type ChatMode = 'concierge' | 'direct';

/**
 * A single message in a chat thread.
 * RTDB: chats/{chatId}/messages/{msgId}
 */
export interface ChatMessage {
  id: string; // RTDB key
  senderId: string;
  text: string;
  ts: number;
  read: boolean;
}

/**
 * Chat thread metadata stored at chats/{chatId}/meta.
 *
 * `participants` is stored as an object keyed by uid (RTDB-idiomatic).
 * This allows O(1) membership checks in both the SDK and RTDB security rules.
 */
export interface ChatMeta {
  participants: Record<string, true>; // { uid1: true, uid2: true }
  listingId: string;
  listingTitle: string;
  mode: ChatMode;
  createdAt: number;
  lastMessage: string;
  lastMessageTs: number;
}

/** A thread as returned to UI consumers. */
export interface ChatThread {
  chatId: string;
  meta: ChatMeta;
}
