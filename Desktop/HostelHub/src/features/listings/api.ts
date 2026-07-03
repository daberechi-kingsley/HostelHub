/**
 * Firestore read layer for listings. Pure data functions — no React here.
 * React Query hooks that wrap these live in ./hooks.ts.
 */
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { Listing } from '@/types/listing';

/** Firestore stores everything in the doc EXCEPT the id (that's the doc key). */
export type ListingDoc = Omit<Listing, 'id'>;

function toListing(snap: QueryDocumentSnapshot): Listing {
  return { id: snap.id, ...(snap.data() as ListingDoc) };
}

/** All active listings, newest first. Powers Home + Search. */
export async function fetchActiveListings(): Promise<Listing[]> {
  const db = getFirebaseDb();
  // Single where() clause — no composite index required.
  // Sort newest-first on the client so we don't need a deployed index on the
  // real Firebase project until firebase deploy --only firestore:indexes is run.
  const q = query(collection(db, 'listings'), where('status', '==', 'active'));
  const snap = await getDocs(q);
  const results = snap.docs.map(toListing);
  return results.sort((a, b) => b.createdAt - a.createdAt);
}

/** A single listing by id, or null if it doesn't exist. Powers the detail page. */
export async function fetchListingById(id: string): Promise<Listing | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'listings', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as ListingDoc) };
}

/**
 * Fetch listings by a set of ids. Powers Saves + Compare.
 * Firestore `in` queries cap at 30 ids, so we chunk.
 */
export async function fetchListingsByIds(ids: string[]): Promise<Listing[]> {
  if (ids.length === 0) return [];
  const db = getFirebaseDb();
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 30) {
    chunks.push(ids.slice(i, i + 30));
  }
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(collection(db, 'listings'), where(documentId(), 'in', chunk));
      const snap = await getDocs(q);
      return snap.docs.map(toListing);
    }),
  );
  const flat = results.flat();
  // Preserve the caller's id order (e.g. most-recently-saved first).
  const byId = new Map(flat.map((l) => [l.id, l]));
  return ids.map((id) => byId.get(id)).filter((l): l is Listing => Boolean(l));
}
