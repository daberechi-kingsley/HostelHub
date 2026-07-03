import { clsx } from 'clsx';
import type { VisitStatus } from '@/types/inquiry';

const CONFIG: Record<VisitStatus, { label: string; className: string }> = {
  pending:   { label: 'Pending',   className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  confirmed: { label: 'Confirmed', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  declined:  { label: 'Declined',  className: 'bg-accent-50 text-accent-700 border-accent-200' },
  cancelled: { label: 'Cancelled', className: 'bg-bg-hover text-text-muted border-border' },
};

export default function VisitStatusBadge({ status }: { status: VisitStatus }) {
  const { label, className } = CONFIG[status] ?? CONFIG.pending;
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
