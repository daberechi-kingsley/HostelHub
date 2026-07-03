/**
 * Card shown on the Landlord Dashboard "Bookings" tab.
 * Read-only — payment state is managed server-side.
 */
import { User, Wallet } from 'lucide-react';
import { clsx } from 'clsx';
import BookingStatusBadge from './BookingStatusBadge';
import { PaymentLogo } from './PaymentBrand';
import { formatFcfa } from '@/lib/format/money';
import type { Booking } from '@/types/booking';

function shortDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function BookingCard({ booking }: { booking: Booking }) {
  return (
    <article
      className={clsx(
        'rounded-2xl border bg-bg-card p-4 transition-shadow hover:shadow-md',
        booking.status === 'paid'            && 'border-emerald-200',
        booking.status === 'pending_payment' && 'border-yellow-200',
        (booking.status === 'cancelled' || booking.status === 'failed') &&
          'border-border opacity-60',
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-hover text-text-muted">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{booking.studentName}</p>
            <p className="mt-0.5 truncate text-xs text-text-muted">{booking.listingTitle}</p>
          </div>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Fee + method */}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-bg px-3 py-2.5">
        <span className="flex items-center gap-1.5 text-sm text-text-muted">
          <Wallet className="h-4 w-4" />
          Booking fee
        </span>
        <span className="flex items-center gap-2">
          <span className="font-heading font-bold tabular-nums">
            {formatFcfa(booking.bookingFee)}
          </span>
          <PaymentLogo method={booking.paymentMethod} className="h-6 w-6" />
        </span>
      </div>

      <p className="mt-2.5 text-xs text-text-muted">
        {booking.status === 'paid' && booking.paidAt
          ? `Paid ${shortDate(booking.paidAt)} — room reserved`
          : `Started ${shortDate(booking.createdAt)}`}
      </p>
    </article>
  );
}
