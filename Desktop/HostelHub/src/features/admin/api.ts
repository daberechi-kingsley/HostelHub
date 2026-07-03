/**
 * Firestore layer for the admin dashboard.
 *
 * All writes here are admin-only — firestore.rules grants them via isAdmin().
 * The client gate (useIsAdmin) and the rules gate use the same logic.
 */
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { VerificationRequest } from '@/types/verification';
import type { Listing } from '@/types/listing';
import type { ListingDoc } from '@/features/listings/api';
import type { AppUser, UserRole } from '@/types/user';

// ── Verification queue ────────────────────────────────────────────────────────

function toRequest(snap: QueryDocumentSnapshot): VerificationRequest {
  return { id: snap.id, ...(snap.data() as Omit<VerificationRequest, 'id'>) };
}

/** Every verification request, newest first (admin sees pending + history). */
export async function fetchAllVerifications(): Promise<VerificationRequest[]> {
  const q = query(
    collection(getFirebaseDb(), 'verificationRequests'),
    orderBy('submittedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(toRequest);
}

/**
 * Approve a request: mark it approved, flip the user's `verified` flag,
 * and verify every listing that user owns — all in one atomic batch.
 */
export async function approveVerification(req: VerificationRequest): Promise<void> {
  const db = getFirebaseDb();

  // Find the applicant's listings first (reads can't go in a batch)
  const listingsSnap = await getDocs(
    query(collection(db, 'listings'), where('ownerId', '==', req.uploaderId)),
  );

  const batch = writeBatch(db);
  batch.update(doc(db, 'verificationRequests', req.id), {
    status: 'approved',
    reviewedAt: Date.now(),
    reviewerNote: '',
  });
  batch.update(doc(db, 'users', req.uploaderId), { verified: true });
  listingsSnap.forEach((d) => batch.update(d.ref, { verified: true }));

  await batch.commit();
}

/** Reject a request with a reason shown back to the applicant. */
export async function rejectVerification(
  requestId: string,
  reviewerNote: string,
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'verificationRequests', requestId), {
    status: 'rejected',
    reviewedAt: Date.now(),
    reviewerNote,
  });
}

// ── Pending listings ──────────────────────────────────────────────────────────

function toListing(snap: QueryDocumentSnapshot): Listing {
  return { id: snap.id, ...(snap.data() as ListingDoc) };
}

/** Listings awaiting admin activation (status === 'pending'). */
export async function fetchPendingListings(): Promise<Listing[]> {
  const q = query(
    collection(getFirebaseDb(), 'listings'),
    where('status', '==', 'pending'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(toListing);
}

/** Approve a pending listing — flip it live so students can see it. */
export async function activateListing(listingId: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'listings', listingId), {
    status: 'active',
    rejectionReason: '',
    updatedAt: Date.now(),
  });
}

/** Reject a pending listing with a reason surfaced to the landlord. */
export async function rejectListing(
  listingId: string,
  reason: string,
): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'listings', listingId), {
    status: 'rejected',
    rejectionReason: reason,
    updatedAt: Date.now(),
  });
}

// ── Dashboard stats ─────────────────────────────────────────────────────────────

export interface AdminStats {
  students: number;
  landlords: number;
  agents: number;
  listings: number;
  pendingVerifications: number;
}

/** Count users by role + total listings + pending verifications for the stats row. */
export async function fetchAdminStats(): Promise<AdminStats> {
  const db = getFirebaseDb();
  const [usersSnap, listingsSnap, pendingVerifSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'listings')),
    getDocs(query(collection(db, 'verificationRequests'), where('status', '==', 'pending'))),
  ]);

  let students = 0;
  let landlords = 0;
  let agents = 0;
  usersSnap.forEach((d) => {
    const role = d.data().role as UserRole;
    if (role === 'student') students += 1;
    else if (role === 'landlord') landlords += 1;
    else if (role === 'agent') agents += 1;
  });

  return {
    students,
    landlords,
    agents,
    listings: listingsSnap.size,
    pendingVerifications: pendingVerifSnap.size,
  };
}

// ── Users management ────────────────────────────────────────────────────────────

/** Every registered user, newest first (admin user-management tab). */
export async function fetchAllUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(getFirebaseDb(), 'users'));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        role: (data.role as UserRole) ?? 'student',
        displayName: data.displayName ?? '',
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
        avatarUrl: data.avatarUrl ?? undefined,
        verified: Boolean(data.verified),
        suspended: Boolean(data.suspended),
        createdAt: data.createdAt ?? 0,
      } as AppUser;
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Suspend or un-suspend a user. */
export async function setUserSuspended(uid: string, suspended: boolean): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', uid), { suspended });
}
