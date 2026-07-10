/**
 * Firestore read/write layer for visit requests (inquiries collection).
 *
 * Doc ID pattern: `${studentId}_${listingId}`
 *   → one request per student per listing
 *   → O(1) lookup — no query, no composite index
 *   → idempotent re-submit (setDoc overwrites)
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { buildChatId } from '@/features/chat/chatUtils';
import { createOrGetChat, sendMessage } from '@/features/chat/api';
import type { VisitRequest, VisitStatus } from '@/types/inquiry';

// ── Time slots shown in the scheduling form ──────────────────────────────────
export const VISIT_SLOTS = [
  '8:00 AM – 10:00 AM',
  '10:00 AM – 12:00 PM',
  '12:00 PM – 2:00 PM',
  '2:00 PM – 4:00 PM',
  '4:00 PM – 6:00 PM',
] as const;

export type VisitSlot = (typeof VISIT_SLOTS)[number];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Predictable doc ID — one request per student per listing. */
export function visitDocId(studentId: string, listingId: string): string {
  return `${studentId}_${listingId}`;
}

function snap2req(id: string, data: Record<string, unknown>): VisitRequest {
  return {
    id,
    studentId:    (data.studentId    as string) ?? '',
    studentName:  (data.studentName  as string) ?? 'Student',
    landlordId:   (data.landlordId   as string) ?? '',
    listingId:    (data.listingId    as string) ?? '',
    listingTitle: (data.listingTitle as string) ?? '',
    proposedDate: (data.proposedDate as string) ?? '',
    proposedSlot: (data.proposedSlot as string) ?? '',
    message:      (data.message      as string) ?? '',
    status:       (data.status       as VisitStatus) ?? 'pending',
    responseNote: (data.responseNote as string) ?? '',
    createdAt:    (data.createdAt    as number) ?? 0,
    updatedAt:    (data.updatedAt    as number) ?? 0,
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

/**
 * Create or replace a visit request.
 * Re-submitting (rescheduling) overwrites the previous request.
 */
export async function setVisitRequest(params: {
  studentId: string;
  studentName: string;
  landlordId: string;
  listingId: string;
  listingTitle: string;
  proposedDate: string;
  proposedSlot: string;
  message: string;
}): Promise<void> {
  const id = visitDocId(params.studentId, params.listingId);
  const now = Date.now();
  await setDoc(doc(getFirebaseDb(), 'inquiries', id), {
    ...params,
    status: 'pending',
    responseNote: '',
    createdAt: now,
    updatedAt: now,
  });

  // Also open a direct chat thread and send the visit message
  const chatId = buildChatId(params.studentId, params.landlordId, params.listingId);
  await createOrGetChat(chatId, {
    participants: { [params.studentId]: true, [params.landlordId]: true },
    listingId: params.listingId,
    listingTitle: params.listingTitle,
    mode: 'direct',
    createdAt: now,
    lastMessage: '',
    lastMessageTs: 0,
  });
  const chatText = params.message
    ? `📅 Visit request for ${params.proposedDate} (${params.proposedSlot}): ${params.message}`
    : `📅 Visit request for ${params.proposedDate} (${params.proposedSlot})`;
  await sendMessage(chatId, params.studentId, chatText);
}

/**
 * Fetch the current user's visit request for a specific listing (or null).
 * O(1) — direct doc read, no query.
 */
export async function getMyVisitRequest(
  studentId: string,
  listingId: string,
): Promise<VisitRequest | null> {
  const id = visitDocId(studentId, listingId);
  const snap = await getDoc(doc(getFirebaseDb(), 'inquiries', id));
  if (!snap.exists()) return null;
  return snap2req(snap.id, snap.data() as Record<string, unknown>);
}

/**
 * All visit requests for a landlord's listings, sorted newest first.
 * Single where() — no composite index.
 */
export async function fetchLandlordVisitRequests(
  landlordId: string,
): Promise<VisitRequest[]> {
  const q = query(
    collection(getFirebaseDb(), 'inquiries'),
    where('landlordId', '==', landlordId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => snap2req(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * All visit requests made by a student, sorted newest first.
 * Single where() — no composite index.
 */
export async function fetchStudentVisitRequests(
  studentId: string,
): Promise<VisitRequest[]> {
  const q = query(
    collection(getFirebaseDb(), 'inquiries'),
    where('studentId', '==', studentId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => snap2req(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Landlord confirms or declines a visit request.
 */
export async function respondToVisit(
  inquiryId: string,
  status: Extract<VisitStatus, 'confirmed' | 'declined'>,
  responseNote: string,
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'inquiries', inquiryId), {
    status,
    responseNote: responseNote.trim(),
    updatedAt: Date.now(),
  });

  // Send the landlord's response as a chat message so the student sees it in-app
  const snap = await getDoc(doc(getFirebaseDb(), 'inquiries', inquiryId));
  if (snap.exists()) {
    const data = snap.data() as { studentId: string; landlordId: string; listingId: string; listingTitle: string };
    const chatId = buildChatId(data.studentId, data.landlordId, data.listingId);
    // Ensure thread exists (in case old requests predate this feature)
    await createOrGetChat(chatId, {
      participants: { [data.studentId]: true, [data.landlordId]: true },
      listingId: data.listingId,
      listingTitle: data.listingTitle,
      mode: 'direct',
      createdAt: Date.now(),
      lastMessage: '',
      lastMessageTs: 0,
    });
    const emoji = status === 'confirmed' ? '✅' : '❌';
    const label = status === 'confirmed' ? 'Visit confirmed' : 'Visit declined';
    const note = responseNote.trim() ? ` — ${responseNote.trim()}` : '';
    await sendMessage(chatId, data.landlordId, `${emoji} ${label}${note}`);
  }
}

/**
 * Student cancels their own pending visit request.
 */
export async function cancelVisitRequest(inquiryId: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'inquiries', inquiryId), {
    status: 'cancelled',
    updatedAt: Date.now(),
  });
}
