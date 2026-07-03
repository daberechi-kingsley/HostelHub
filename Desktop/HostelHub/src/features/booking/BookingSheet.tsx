/**
 * Bottom sheet for the 10% booking-fee checkout.
 *
 * States:
 *   • No booking          → fee summary + payment method picker + phone form
 *   • pending_payment     → "approve on your phone" screen with sandbox
 *                           "I have paid" stub button + cancel
 *   • paid                → success — listing is reserved
 *   • cancelled / failed  → back to the form (retry)
 *
 * PAYMENT PLACEHOLDER: while MoMo/Orange Money API credentials are pending,
 * confirmBookingPayment is a sandbox stub. Once credentials arrive, the
 * provider webhook confirms payment instead and the stub button is removed —
 * nothing else in this component changes.
 */
import { useEffect, useState } from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  FlaskConical,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { PaymentMethodTile, PaymentLogo } from './PaymentBrand';
import { useMyBooking, useInitiateBooking, useConfirmBookingPayment, useCancelBooking } from './hooks';
import { isValidCmPhone } from './api';
import { formatFcfa } from '@/lib/format/money';
import { BOOKING_FEE_FLAT } from '@/config/constants';
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from '@/types/booking';
import type { Listing } from '@/types/listing';

interface Props {
  listing: Listing;
  open: boolean;
  onClose: () => void;
}

export default function BookingSheet({ listing, open, onClose }: Props) {
  const { data: booking, isLoading: bookingLoading } = useMyBooking(listing.id);
  const initiate = useInitiateBooking(listing.id);
  const confirm  = useConfirmBookingPayment(listing.id);
  const cancel   = useCancelBooking(listing.id);

  const [method, setMethod] = useState<PaymentMethod>('mtn_momo');
  const [phone,  setPhone]  = useState('');
  const [error,  setError]  = useState<string | null>(null);

  const bookingFee = BOOKING_FEE_FLAT;
  const isBusy = initiate.isPending || confirm.isPending || cancel.isPending;

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Reset transient form state when the sheet opens
  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  if (!open) return null;

  async function handlePay() {
    setError(null);
    if (!isValidCmPhone(phone)) {
      setError('Enter a valid Cameroon mobile number — 9 digits starting with 6 (e.g. 670123456).');
      return;
    }
    try {
      await initiate.mutateAsync({ paymentMethod: method, payerPhone: phone });
    } catch {
      setError('Could not start the booking. The room may no longer be available.');
    }
  }

  async function handleConfirmStub() {
    if (!booking) return;
    setError(null);
    try {
      await confirm.mutateAsync(booking.id);
    } catch {
      setError('Could not confirm the payment. Try again.');
    }
  }

  async function handleCancel() {
    if (!booking) return;
    setError(null);
    try {
      await cancel.mutateAsync(booking.id);
    } catch {
      setError('Could not cancel. Try again.');
    }
  }

  const showForm =
    !booking || booking.status === 'cancelled' || booking.status === 'failed';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reserve with booking fee"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-bg-card p-6 shadow-xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="pr-8">
            <h2 className="font-heading text-xl font-bold">Reserve this room</h2>
            <p className="mt-0.5 text-sm text-text-muted line-clamp-1">{listing.title}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-text-muted hover:bg-bg-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">
          {bookingLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>

          ) : showForm ? (
            /* ── Checkout form ────────────────────────────────────────── */
            <div className="space-y-5">
              {booking?.status === 'failed' && (
                <div className="flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Your previous payment didn't go through. You can try again below.
                </div>
              )}

              {/* Fee summary */}
              <div className="rounded-2xl border border-border bg-bg p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-muted">Annual rent</span>
                  <span className="font-medium">{formatFcfa(listing.pricePerYear)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-text-muted">Booking fee</span>
                  <span className="font-heading text-xl font-bold text-primary">
                    {formatFcfa(bookingFee)}
                  </span>
                </div>
                <div className="mt-3 flex items-start gap-2 border-t border-border pt-3 text-xs text-text-muted">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-verified" />
                  You only pay the booking fee here. The rent itself goes directly to the
                  landlord — never through HostelHub.
                </div>
              </div>

              {/* Payment method */}
              <div>
                <p className="mb-2 text-sm font-medium">Pay with</p>
                <div className="grid grid-cols-2 gap-3">
                  <PaymentMethodTile
                    method="mtn_momo"
                    selected={method === 'mtn_momo'}
                    onSelect={() => setMethod('mtn_momo')}
                  />
                  <PaymentMethodTile
                    method="orange_money"
                    selected={method === 'orange_money'}
                    onSelect={() => setMethod('orange_money')}
                  />
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="pay-phone">
                  {method === 'mtn_momo' ? 'MTN MoMo number' : 'Orange Money number'}
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-4 py-3 focus-within:border-primary">
                  <Smartphone className="h-4 w-4 shrink-0 text-text-muted" />
                  <span className="text-sm text-text-muted">+237</span>
                  <input
                    id="pay-phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="6XX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>
              )}

              <Button
                type="button"
                variant="primary"
                fullWidth
                size="lg"
                disabled={isBusy}
                onClick={handlePay}
              >
                {isBusy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Starting payment…
                  </span>
                ) : (
                  `Pay ${formatFcfa(bookingFee)}`
                )}
              </Button>
            </div>

          ) : booking.status === 'paid' ? (
            /* ── Paid / reserved ──────────────────────────────────────── */
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <div>
                  <p className="font-heading text-lg font-bold text-emerald-800">
                    Room reserved! 🎉
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    Booking fee of {formatFcfa(booking.bookingFee)} received via{' '}
                    {PAYMENT_METHOD_LABEL[booking.paymentMethod]}.
                  </p>
                </div>
              </div>
              <p className="text-center text-xs text-text-muted">
                The landlord has been notified. Use chat to arrange your move-in and pay the
                rent directly to them.
              </p>
              <Button type="button" variant="primary" fullWidth onClick={onClose}>
                Done
              </Button>
            </div>

          ) : (
            /* ── pending_payment ──────────────────────────────────────── */
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 px-4 py-6 text-center">
                <PaymentLogo method={booking.paymentMethod} className="h-14 w-14" />
                <div>
                  <p className="font-semibold text-yellow-800">
                    Approve the payment on your phone
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    A request for <span className="font-bold">{formatFcfa(booking.bookingFee)}</span>{' '}
                    was sent to <span className="font-medium">+237 {booking.payerPhone}</span> via{' '}
                    {PAYMENT_METHOD_LABEL[booking.paymentMethod]}.
                  </p>
                  <p className="mt-2 text-xs text-yellow-600">
                    Dial {booking.paymentMethod === 'mtn_momo' ? '*126#' : '#150#'} if you didn't
                    receive the prompt.
                  </p>
                </div>
              </div>

              {/* Sandbox stub — removed once the real MoMo/OM webhook is live */}
              {booking.sandbox && (
                <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <FlaskConical className="h-3.5 w-3.5" />
                    Test mode — payment API not connected yet
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    fullWidth
                    className="mt-2"
                    disabled={isBusy}
                    onClick={handleConfirmStub}
                  >
                    {confirm.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Simulate successful payment'
                    )}
                  </Button>
                </div>
              )}

              {error && (
                <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>
              )}

              <Button
                type="button"
                variant="ghost"
                fullWidth
                disabled={isBusy}
                onClick={handleCancel}
                className="text-accent-700 hover:bg-accent-50"
              >
                {cancel.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel booking'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
