import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import {
  getMyVisitRequest,
  fetchLandlordVisitRequests,
  fetchStudentVisitRequests,
  setVisitRequest,
  respondToVisit,
  cancelVisitRequest,
  type VisitSlot,
} from './api';
import type { VisitStatus } from '@/types/inquiry';

// ── Student hooks ─────────────────────────────────────────────────────────────

/**
 * The current user's visit request for a specific listing.
 * O(1) — direct doc read, no query.
 */
export function useMyVisitRequest(listingId: string) {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid ?? '';
  return useQuery({
    queryKey: ['visitRequest', uid, listingId],
    queryFn: () => getMyVisitRequest(uid, listingId),
    enabled: Boolean(uid) && Boolean(listingId),
  });
}

/** All visit requests made by the current student. */
export function useMyVisitRequests() {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid ?? '';
  return useQuery({
    queryKey: ['myVisitRequests', uid],
    queryFn: () => fetchStudentVisitRequests(uid),
    enabled: Boolean(uid),
  });
}

/** Create or update (reschedule) a visit request. */
export function useSetVisitRequest(listingId: string) {
  const qc = useQueryClient();
  const { firebaseUser } = useUser();

  return useMutation({
    mutationFn: (params: {
      landlordId: string;
      listingTitle: string;
      proposedDate: string;
      proposedSlot: VisitSlot;
      message: string;
    }) => {
      if (!firebaseUser) return Promise.reject(new Error('Not signed in'));
      return setVisitRequest({
        studentId: firebaseUser.uid,
        studentName: firebaseUser.displayName ?? 'Student',
        ...params,
        listingId,
      });
    },
    onSuccess: () => {
      if (firebaseUser) {
        qc.invalidateQueries({ queryKey: ['visitRequest', firebaseUser.uid, listingId] });
        qc.invalidateQueries({ queryKey: ['myVisitRequests', firebaseUser.uid] });
      }
    },
  });
}

/** Cancel the current user's visit request for a listing. */
export function useCancelVisit(listingId: string) {
  const qc = useQueryClient();
  const { firebaseUser } = useUser();

  return useMutation({
    mutationFn: (inquiryId: string) => cancelVisitRequest(inquiryId),
    onSuccess: () => {
      if (firebaseUser) {
        qc.invalidateQueries({ queryKey: ['visitRequest', firebaseUser.uid, listingId] });
        qc.invalidateQueries({ queryKey: ['landlordVisits', firebaseUser.uid] });
      }
    },
  });
}

// ── Landlord hooks ────────────────────────────────────────────────────────────

/** All visit requests addressed to the current landlord. */
export function useLandlordVisitRequests() {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid ?? '';
  return useQuery({
    queryKey: ['landlordVisits', uid],
    queryFn: () => fetchLandlordVisitRequests(uid),
    enabled: Boolean(uid),
  });
}

/** Confirm or decline a visit request. */
export function useRespondToVisit() {
  const qc = useQueryClient();
  const { firebaseUser } = useUser();

  return useMutation({
    mutationFn: ({
      inquiryId,
      status,
      note,
    }: {
      inquiryId: string;
      status: Extract<VisitStatus, 'confirmed' | 'declined'>;
      note: string;
    }) => respondToVisit(inquiryId, status, note),
    onSuccess: () => {
      if (firebaseUser) {
        qc.invalidateQueries({ queryKey: ['landlordVisits', firebaseUser.uid] });
      }
    },
  });
}
