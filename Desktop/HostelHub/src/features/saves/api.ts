/**
 * Firestore read/write layer for per-user saves.
 *
 * Path: saves/{uid}/listings/{listingId}
 *   — The top-level `saves` collection groups all user save sub-collections.
 *   — Each document in `listings` is just { savedAt: Timestamp }.
 *   — Security rules (firestore.rules) ensure only the owning uid can read/write.
 */
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

/** Reference to saves/{uid}/listings sub-collection. */
function listingsRef(uid: string) {
  return collection(getFirebaseDb(), 'saves', uid, 'listings');
}

/** Fetch all listing IDs the user has saved (order is Firestore insertion order). */
export async function fetchSavedIds(uid: string): Promise<string[]> {
  const snap = await getDocs(listingsRef(uid));
  return snap.docs.map((d) => d.id);
}

/** Write a single listing to the user's saves. Idempotent (setDoc). */
export async function saveListing(uid: string, listingId: string): Promise<void> {
  await setDoc(doc(listingsRef(uid), listingId), { savedAt: serverTimestamp() });
}

/** Remove a single listing from the user's saves. */
export async function unsaveListing(uid: string, listingId: string): Promise<void> {
  await deleteDoc(doc(listingsRef(uid), listingId));
}

/**
 * Write all ids from localStorage to Firestore at once.
 * Called once on sign-in to migrate anonymous saves.
 */
export async function mergeLocalSaves(uid: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await Promise.all(ids.map((id) => saveListing(uid, id)));
}
