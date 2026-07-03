export type PaymentMethod = 'mtn_momo' | 'orange_money';

export type BookingStatus =
  | 'pending_payment'   // booking created, waiting for MoMo/OM approval
  | 'paid'              // fee received — listing flips to 'reserved'
  | 'cancelled'         // student cancelled before paying
  | 'failed';           // payment provider reported failure

/**
 * A student's 10% booking-fee transaction for a listing.
 *
 * Doc ID: `${studentId}_${listingId}` — one active booking per student per
 * listing, O(1) lookup, no composite index.
 *
 * SECURITY: bookings are written ONLY by Cloud Functions (Admin SDK).
 * Client rules keep `allow write: if false` so fee/status state stays trusted.
 */
export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  landlordId: string;
  listingId: string;
  listingTitle: string;
  pricePerYear: number;     // FCFA — snapshot at booking time
  bookingFee: number;       // FCFA — 10% of pricePerYear, computed server-side
  paymentMethod: PaymentMethod;
  payerPhone: string;       // MoMo/OM number, 9 digits (no +237)
  status: BookingStatus;
  /** True while the payment provider is the built-in sandbox stub. */
  sandbox: boolean;
  createdAt: number;
  paidAt: number | null;
  updatedAt: number;
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  mtn_momo: 'MTN Mobile Money',
  orange_money: 'Orange Money',
};
