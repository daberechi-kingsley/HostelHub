/**
 * Booking-fee flow (10% of annual rent — locked decision).
 *
 * Money state is server-trusted: ALL booking writes go through Cloud Function
 * callables (Admin SDK). The client only READS booking docs directly.
 *
 *   initiateBooking({listingId, paymentMethod, payerPhone})
 *     → creates bookings/{studentId}_{listingId} as 'pending_payment'
 *   confirmBookingPayment({bookingId})
 *     → PLACEHOLDER for the MoMo/OM webhook. While in sandbox mode the
 *       student presses "I have paid" and this stub flips the booking to
 *       'paid' + the listing to 'reserved'. When real API credentials arrive,
 *       this callable is replaced by momoWebhook / orangeWebhook and the
 *       button disappears — the rest of the flow is untouched.
 *   cancelBooking({bookingId})
 *     → student cancels while still 'pending_payment'
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { getFirebaseDb } from '@/lib/firebase';
import { getFirebaseFunctions } from '@/lib/firebase/functions';
import type { Booking, BookingStatus, PaymentMethod } from '@/types/booking';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Predictable doc ID — one booking per student per listing. */
export function bookingDocId(studentId: string, listingId: string): string {
  return `${studentId}_${listingId}`;
}

/** Cameroon mobile number: 9 digits starting with 6 (no +237 prefix). */
export function isValidCmPhone(phone: string): boolean {
  return /^6\d{8}$/.test(phone);
}

function snap2booking(id: string, data: Record<string, unknown>): Booking {
  return {
    id,
    studentId:     (data.studentId     as string) ?? '',
    studentName:   (data.studentName   as string) ?? 'Student',
    landlordId:    (data.landlordId    as string) ?? '',
    listingId:     (data.listingId     as string) ?? '',
    listingTitle:  (data.listingTitle  as string) ?? '',
    pricePerYear:  (data.pricePerYear  as number) ?? 0,
    bookingFee:    (data.bookingFee    as number) ?? 0,
    paymentMethod: (data.paymentMethod as PaymentMethod) ?? 'mtn_momo',
    payerPhone:    (data.payerPhone    as string) ?? '',
    status:        (data.status        as BookingStatus) ?? 'pending_payment',
    sandbox:       (data.sandbox       as boolean) ?? true,
    createdAt:     (data.createdAt     as number) ?? 0,
    paidAt:        (data.paidAt        as number | null) ?? null,
    updatedAt:     (data.updatedAt     as number) ?? 0,
  };
}

// ── Reads (direct Firestore — rules allow student/landlord/admin) ────────────

/** The current user's booking for a listing, or null. O(1) doc read. */
export async function getMyBooking(
  studentId: string,
  listingId: string,
): Promise<Booking | null> {
  const snap = await getDoc(
    doc(getFirebaseDb(), 'bookings', bookingDocId(studentId, listingId)),
  );
  if (!snap.exists()) return null;
  return snap2booking(snap.id, snap.data() as Record<string, unknown>);
}

/** All bookings on a landlord's listings, newest first. Single where(). */
export async function fetchLandlordBookings(landlordId: string): Promise<Booking[]> {
  const q = query(
    collection(getFirebaseDb(), 'bookings'),
    where('landlordId', '==', landlordId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => snap2booking(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** All bookings made by a student, newest first. Single where(). */
export async function fetchStudentBookings(studentId: string): Promise<Booking[]> {
  const q = query(
    collection(getFirebaseDb(), 'bookings'),
    where('studentId', '==', studentId),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => snap2booking(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.createdAt - a.createdAt);
}

// ── Writes (Cloud Function callables only) ────────────────────────────────────

interface InitiateBookingResult {
  bookingId: string;
  bookingFee: number;
  sandbox: boolean;
}

export async function initiateBooking(params: {
  listingId: string;
  paymentMethod: PaymentMethod;
  payerPhone: string;
}): Promise<InitiateBookingResult> {
  const fn = httpsCallable<typeof params, InitiateBookingResult>(
    getFirebaseFunctions(),
    'initiateBooking',
  );
  const result = await fn(params);
  return result.data;
}

export async function confirmBookingPayment(bookingId: string): Promise<void> {
  const fn = httpsCallable<{ bookingId: string }, { status: string }>(
    getFirebaseFunctions(),
    'confirmBookingPayment',
  );
  await fn({ bookingId });
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const fn = httpsCallable<{ bookingId: string }, { status: string }>(
    getFirebaseFunctions(),
    'cancelBooking',
  );
  await fn({ bookingId });
}
