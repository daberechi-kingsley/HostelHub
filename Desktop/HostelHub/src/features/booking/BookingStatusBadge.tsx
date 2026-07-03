import { clsx } from 'clsx';
import type { BookingStatus } from '@/types/booking';

const CONFIG: Record<BookingStatus, { label: string; className: string }> = {
  pending_payment: { label: 'Awaiting payment', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  paid:            { label: 'Paid',             className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled:       { label: 'Cancelled',        className: 'bg-bg-hover text-text-muted border-border' },
  failed:          { label: 'Failed',           className: 'bg-accent-50 text-accent-700 border-accent-200' },
};

export default function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.pending_payment;
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        className,
      )}
    >
      {label}
    </span>
  );
}
