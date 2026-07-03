/**
 * /admin — founder-only dashboard.
 *
 * Gated by useIsAdmin (role === 'admin' OR email in ADMIN_EMAILS).
 * Two panels: verification queue and pending-listing activation.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ShieldCheck, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/hooks/useUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import AdminStats from '@/features/admin/AdminStats';
import VerificationQueue from '@/features/admin/VerificationQueue';
import PendingListings from '@/features/admin/PendingListings';
import UsersList from '@/features/admin/UsersList';
import EmptyState from '@/components/feedback/EmptyState';
import PageSpinner from '@/components/feedback/PageSpinner';
import { useT } from '@/i18n/useT';
import type { TranslationKey } from '@/i18n/translations';

type Tab = 'verifications' | 'listings' | 'users';

const TABS: { id: Tab; labelKey: TranslationKey; icon: typeof ShieldCheck }[] = [
  { id: 'verifications', labelKey: 'admin.tabVerifications', icon: ShieldCheck },
  { id: 'listings', labelKey: 'admin.tabListings', icon: ClipboardList },
  { id: 'users', labelKey: 'admin.tabUsers', icon: Users },
];

export default function AdminPage() {
  const t = useT();
  const { loading: authLoading } = useUser();
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState<Tab>('verifications');

  if (authLoading) return <PageSpinner />;

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20">
        <EmptyState
          title={t('admin.onlyTitle')}
          description={t('admin.onlyDesc')}
          action={
            <Link to="/" className="btn-primary">
              {t('common.backToHome')}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <h1 className="font-heading text-2xl font-bold">{t('admin.title')}</h1>
      <p className="mt-1 text-sm text-text-muted">{t('admin.subtitle')}</p>

      {/* Stats row */}
      <div className="mt-5">
        <AdminStats />
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-full border border-border bg-bg-card p-1">
        {TABS.map(({ id, labelKey, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={clsx(
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-colors',
              tab === id
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text',
            )}
          >
            <Icon className="h-4 w-4" />
            {t(labelKey)}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'verifications' && <VerificationQueue />}
        {tab === 'listings' && <PendingListings />}
        {tab === 'users' && <UsersList />}
      </div>
    </div>
  );
}
