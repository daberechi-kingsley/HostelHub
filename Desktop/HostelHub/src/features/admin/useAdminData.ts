/**
 * React Query hooks + mutations for the admin dashboard.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  activateListing,
  approveVerification,
  fetchAdminStats,
  fetchAllUsers,
  fetchAllVerifications,
  fetchPendingListings,
  rejectListing,
  rejectVerification,
  setUserSuspended,
} from './api';
import type { VerificationRequest } from '@/types/verification';

const VERIFICATIONS_KEY = ['admin', 'verifications'];
const PENDING_LISTINGS_KEY = ['admin', 'pendingListings'];
const STATS_KEY = ['admin', 'stats'];
const USERS_KEY = ['admin', 'users'];

export function useAdminStats() {
  return useQuery({
    queryKey: STATS_KEY,
    queryFn: fetchAdminStats,
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: fetchAllUsers,
  });
}

export function useVerificationQueue() {
  return useQuery({
    queryKey: VERIFICATIONS_KEY,
    queryFn: fetchAllVerifications,
  });
}

export function usePendingListings() {
  return useQuery({
    queryKey: PENDING_LISTINGS_KEY,
    queryFn: fetchPendingListings,
  });
}

/** Approve / reject mutations — invalidate the queue + public listings on success. */
export function useVerificationActions() {
  const qc = useQueryClient();

  const approve = useMutation({
    mutationFn: (req: VerificationRequest) => approveVerification(req),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: VERIFICATIONS_KEY });
      void qc.invalidateQueries({ queryKey: STATS_KEY });
      void qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      rejectVerification(id, note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: VERIFICATIONS_KEY });
      void qc.invalidateQueries({ queryKey: STATS_KEY });
    },
  });

  return { approve, reject };
}

/** Approve (activate) / reject mutations for pending listings. */
export function useListingReviewActions() {
  const qc = useQueryClient();

  const approve = useMutation({
    mutationFn: (listingId: string) => activateListing(listingId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PENDING_LISTINGS_KEY });
      void qc.invalidateQueries({ queryKey: STATS_KEY });
      void qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectListing(id, reason),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: PENDING_LISTINGS_KEY });
      void qc.invalidateQueries({ queryKey: STATS_KEY });
    },
  });

  return { approve, reject };
}

/** Suspend / un-suspend a user — invalidates the users list. */
export function useSuspendUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ uid, suspended }: { uid: string; suspended: boolean }) =>
      setUserSuspended(uid, suspended),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}
