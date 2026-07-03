import { clsx } from 'clsx';
import { useT } from '@/i18n/useT';
import type { TranslationKey } from '@/i18n/translations';
import type { ListingStatus } from '@/types/listing';

const CONFIG: Record<ListingStatus, { labelKey: TranslationKey; className: string }> = {
  draft:    { labelKey: 'status.draft',    className: 'bg-bg-hover text-text-muted border-border' },
  pending:  { labelKey: 'status.pending',  className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  active:   { labelKey: 'status.active',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  reserved: { labelKey: 'status.reserved', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  rented:   { labelKey: 'status.rented',   className: 'bg-purple-50 text-purple-700 border-purple-200' },
  rejected: { labelKey: 'status.rejected', className: 'bg-accent-50 text-accent-700 border-accent-200' },
};

export default function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const t = useT();
  const { labelKey, className } = CONFIG[status] ?? CONFIG.draft;
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold',
        className,
      )}
    >
      {t(labelKey)}
    </span>
  );
}
