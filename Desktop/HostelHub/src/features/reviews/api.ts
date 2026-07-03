/**
 * Firestore layer for listing reviews.
 *
 * Doc ID: `${authorId}_${listingId}` — one review per student per listing.
 * Rules allow create only (author must match auth); the listing's
 * rating/reviewCount aggregates are recomputed by the onReviewCreated
 * Cloud Function trigger, never written from the client.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Review } from '@/types/review';

export function reviewDocId(authorId: string, listingId: string): string {
  return `${authorId}_${listingId}`;
}

function snap2review(id: string, data: Record<string, unknown>): Review {
  return {
    id,
    listingId:  (data.listingId  as string) ?? '',
    authorId:   (data.authorId   as string) ?? '',
    authorName: (data.authorName as string) ?? 'Student',
    rating:     (data.rating     as number) ?? 0,
    text:       (data.text       as string) ?? '',
    createdAt:  (data.createdAt  as number) ?? 0,
  };
}

/** All reviews for a listing, newest first. Single where() — no index. */
export async function fetchListingReviews(listingId: string): Promise<Review[]> {
  const q = query(
    collection(getFirebaseDb(), 'reviews'),
    where('listingId', '==', listingId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => snap2review(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** The current user's review for a listing, or null. O(1) doc read. */
export async function getMyReview(
  authorId: string,
  listingId: string,
): Promise<Review | null> {
  const snap = await getDoc(
    doc(getFirebaseDb(), 'reviews', reviewDocId(authorId, listingId)),
  );
  if (!snap.exists()) return null;
  return snap2review(snap.id, snap.data() as Record<string, unknown>);
}

/** Create the current user's review (one per listing — rules reject updates). */
export async function addReview(params: {
  authorId: string;
  authorName: string;
  listingId: string;
  rating: number;
  text: string;
}): Promise<void> {
  const id = reviewDocId(params.authorId, params.listingId);
  await setDoc(doc(getFirebaseDb(), 'reviews', id), {
    ...params,
    rating: Math.min(5, Math.max(1, Math.round(params.rating))),
    text: params.text.trim().slice(0, 500),
    createdAt: Date.now(),
  });
}
