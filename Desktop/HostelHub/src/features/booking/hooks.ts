import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import {
  getMyBooking,
  fetchLandlordBookings,
  fetchStudentBookings,
  initiateBooking,
  confirmBookingPayment,
  cancelBooking,
} from './api';
import type { PaymentMethod } from '@/types/booking';

// ── Student hooks ─────────────────────────────────────────────────────────────

/** The current user's booking for a specific listing. O(1) doc read. */
export function useMyBooking(listingId: string) {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid ?? '';
  return useQuery({
    queryKey: ['booking', uid, listingId],
    queryFn:  () => getMyBooking(uid, listingId),
    enabled:  Boolean(uid) && Boolean(listingId),
  });
}

/** All bookings made by the current student. */
export function useMyBookings() {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid ?? '';
  return useQuery({
    queryKey: ['myBookings', uid],
    queryFn:  () => fetchStudentBookings(uid),
    enabled:  Boolean(uid),
  });
}

function useInvalidateBooking(listingId: string) {
  const qc = useQueryClient();
  const { firebaseUser } = useUser();
  return () => {
    if (!firebaseUser) return;
    qc.invalidateQueries({ queryKey: ['booking', firebaseUser.uid, listingId] });
    qc.invalidateQueries({ queryKey: ['myBookings', firebaseUser.uid] });
    // Listing status may have flipped to 'reserved'
    qc.invalidateQueries({ queryKey: ['listing', listingId] });
    qc.invalidateQueries({ queryKey: ['listings'] });
  };
}

/** Start a booking → server creates the doc as 'pending_payment'. */
export function useInitiateBooking(listingId: string) {
  const invalidate = useInvalidateBooking(listingId);
  return useMutation({
    mutationFn: (params: { paymentMethod: PaymentMethod; payerPhone: string }) =>
      initiateBooking({ listingId, ...params }),
    onSuccess: invalidate,
  });
}

/** Sandbox stub: confirm payment → 'paid' + listing 'reserved'. */
export function useConfirmBookingPayment(listingId: string) {
  const invalidate = useInvalidateBooking(listingId);
  return useMutation({
    mutationFn: (bookingId: string) => confirmBookingPayment(bookingId),
    onSuccess: invalidate,
  });
}

/** Cancel a 'pending_payment' booking. */
export function useCancelBooking(listingId: string) {
  const invalidate = useInvalidateBooking(listingId);
  return useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: invalidate,
  });
}

// ── Landlord hooks ────────────────────────────────────────────────────────────

/** All bookings on the current landlord's listings. */
export function useLandlordBookings() {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid ?? '';
  return useQuery({
    queryKey: ['landlordBookings', uid],
    queryFn:  () => fetchLandlordBookings(uid),
    enabled:  Boolean(uid),
  });
}
