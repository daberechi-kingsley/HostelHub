/**
 * Stats row at the top of the admin dashboard.
 * Counts are fetched live from Firestore (users / listings / verificationRequests).
 */
import { useAdminStats } from './useAdminData';
import type { AdminStats as AdminStatsData } from './api';
import { useT } from '@/i18n/useT';
import type { TranslationKey } from '@/i18n/translations';

const CARDS: { key: keyof AdminStatsData; labelKey: TranslationKey }[] = [
  { key: 'students',             labelKey: 'admin.students' },
  { key: 'landlords',            labelKey: 'admin.landlords' },
  { key: 'agents',               labelKey: 'admin.agents' },
  { key: 'listings',             labelKey: 'admin.listings' },
  { key: 'pendingVerifications', labelKey: 'admin.pendingVerifications' },
];

export default function AdminStats() {
  const t = useT();
  const { data, isLoading } = useAdminStats();

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {CARDS.map(({ key, labelKey }) => (
        <div key={key} className="rounded-card border border-border bg-bg-card px-4 py-3">
          {isLoading ? (
            <div className="h-8 w-10 animate-pulse rounded bg-bg-hover" />
          ) : (
            <p className="font-heading text-2xl font-bold tabular-nums text-text">
              {data?.[key] ?? 0}
            </p>
          )}
          <p className="mt-0.5 text-xs text-text-muted">{t(labelKey)}</p>
        </div>
      ))}
    </div>
  );
}
