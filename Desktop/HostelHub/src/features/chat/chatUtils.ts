/**
 * Pure utilities for the chat feature:
 *   buildChatId  — deterministic, stable ID for a thread
 *   resolveCounterpart — server-flag-aware counterpart lookup (Firestore-side only,
 *                        no Cloud Function call required so it works without Auth tokens)
 */
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { ChatMode } from '@/types/chat';

/**
 * Deterministic chat ID — same two users + same listing always land in the same thread.
 * Sorting ensures buildChatId(A, B, x) === buildChatId(B, A, x).
 */
export function buildChatId(uidA: string, uidB: string, listingId: string): string {
  return `${[uidA, uidB].sort().join('_')}_${listingId}`;
}

export interface CounterpartResult {
  counterpartUid: string;
  mode: ChatMode;
}

/**
 * Resolve which uid the current user should chat with for a given listing.
 *
 * Reads `config/global` from Firestore (public read — no auth required):
 *   chatMode = 'concierge' → counterpart is `conciergeUid` (founder handles all DMs)
 *   chatMode = 'direct'    → counterpart is the listing owner
 *
 * Falls back to direct → listing owner if the config doc is missing.
 */
export async function resolveCounterpart(listingId: string): Promise<CounterpartResult> {
  const db = getFirebaseDb();

  const [configSnap, listingSnap] = await Promise.all([
    getDoc(doc(db, 'config', 'global')),
    getDoc(doc(db, 'listings', listingId)),
  ]);

  const ownerId =
    (listingSnap.data() as { ownerId?: string } | undefined)?.ownerId ?? '';

  if (!ownerId) {
    throw new Error(`Listing "${listingId}" not found or has no owner — cannot open chat.`);
  }

  if (!configSnap.exists()) {
    // Config doc not seeded yet — safe default: direct to listing owner
    return { counterpartUid: ownerId, mode: 'direct' };
  }

  const config = configSnap.data() as {
    chatMode?: ChatMode;
    conciergeUid?: string;
  };
  const chatMode = config.chatMode ?? 'direct';

  if (chatMode === 'concierge') {
    // Fall back to listing owner if concierge uid not set
    const conciergeUid = config.conciergeUid ?? ownerId;
    return { counterpartUid: conciergeUid, mode: 'concierge' };
  }

  return { counterpartUid: ownerId, mode: 'direct' };
}
