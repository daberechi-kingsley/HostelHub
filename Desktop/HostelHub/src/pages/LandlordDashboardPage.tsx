/**
 * Landlord / Agent dashboard.
 *
 * Route: /dashboard
 * Access: landlord | agent | admin (students see a "not for you" empty state)
 *
 * Layout:
 *   ┌─ Stats strip (Total / Active / Pending / Drafts) ──────────────────┐
 *   │                                                                     │
 *   │  [+ New listing]                            Verification status →  │
 *   │                                                                     │
 *   │  MyListingCard grid  OR  add/edit form (slides in)                 │
 *   └─────────────────────────────────────────────────────────────────────┘
 */
import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  PlusCircle,
  ArrowRight,
  ShieldAlert,
  Loader2,
  LayoutGrid,
  CalendarDays,
  Building2,
  Wallet,
} from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useMyListings } from '@/features/landlord/hooks';
import { useLandlordVisitRequests } from '@/features/visits/hooks';
import { useLandlordBookings } from '@/features/booking/hooks';
import MyListingCard from '@/features/landlord/MyListingCard';
import AddListingForm from '@/features/landlord/AddListingForm';
import VisitRequestCard from '@/features/visits/VisitRequestCard';
import BookingCard from '@/features/booking/BookingCard';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import VerifiedCelebration from '@/features/verification/VerifiedCelebration';
import { useVerifiedCelebration } from '@/features/verification/useVerifiedCelebration';
import EmptyState from '@/components/feedback/EmptyState';
import PageSpinner from '@/components/feedback/PageSpinner';
import { formatFcfa } from '@/lib/format/money';
import { useT } from '@/i18n/useT';
import type { TranslationKey } from '@/i18n/translations';
import type { Listing } from '@/types/listing';

type View = 'list' | 'add' | { mode: 'edit'; listing: Listing };
type Tab  = 'listings' | 'visits' | 'bookings';

export default function LandlordDashboardPage() {
  const t = useT();
  const { firebaseUser, appUser, loading } = useUser();
  const isAdmin = useIsAdmin();
  const { data: listings, isLoading: listingsLoading } = useMyListings();
  const { data: visits,   isLoading: visitsLoading   } = useLandlordVisitRequests();
  const { data: bookings, isLoading: bookingsLoading } = useLandlordBookings();
  const [view, setView] = useState<View>('list');
  const [tab,  setTab]  = useState<Tab>('listings');

  // Fire the one-time confetti when this account becomes verified.
  const { celebrate, dismiss } = useVerifiedCelebration(appUser?.uid, Boolean(appUser?.verified));

  // ── Auth / Role guards ────────────────────────────────────────────────────
  if (loading) return <PageSpinner />;
  if (!firebaseUser || !appUser) return <Navigate to="/" replace />;

  if (appUser.role === 'student' && !isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <EmptyState
          icon={<LayoutGrid className="h-10 w-10" />}
          title={t('dash.studentBlockedTitle')}
          description={t('dash.studentBlockedDesc')}
          action={
            <Link to="/" className="btn-primary">
              {t('common.backToHome')}
            </Link>
          }
        />
      </div>
    );
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const total   = listings?.length ?? 0;
  const active  = listings?.filter((l) => l.status === 'active').length ?? 0;
  const pending = listings?.filter((l) => l.status === 'pending').length ?? 0;
  const drafts  = listings?.filter((l) => l.status === 'draft').length ?? 0;

  // ── Verification badge ────────────────────────────────────────────────────
  const isVerified = appUser.verified;

  // ── Render: add / edit form view ──────────────────────────────────────────
  if (view === 'add' || (typeof view === 'object' && view.mode === 'edit')) {
    const isEdit = typeof view === 'object' && view.mode === 'edit';
    return (
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-6 sm:px-6">
        <button
          type="button"
          onClick={() => setView('list')}
          className="mb-6 text-sm font-medium text-text-muted hover:text-text"
        >
          ← {t('dash.backToDashboard')}
        </button>

        <h1 className="mb-6 font-heading text-2xl font-bold">
          {isEdit ? t('dash.editListing') : t('dash.newListingTitle')}
        </h1>

        <AddListingForm
          initialListing={isEdit ? (view as { mode: 'edit'; listing: Listing }).listing : undefined}
          onSuccess={() => {
            setView('list');
          }}
          onCancel={() => setView('list')}
        />
      </div>
    );
  }

  // ── Render: list view ─────────────────────────────────────────────────────
  return (
    <div className="px-4 pb-16 pt-6 sm:px-6">
      {celebrate && <VerifiedCelebration onDone={dismiss} />}

      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">{t('dash.title')}</h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <p className="text-sm text-text-muted">
              {appUser.displayName} · {appUser.role === 'agent' ? t('role.agentShort') : t('role.landlordShort')}
            </p>
            {isVerified && <VerifiedBadge />}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setView('add')}
          className="btn-primary flex items-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          {t('dash.newListing')}
        </button>
      </div>

      {/* Stats strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {([
          { labelKey: 'dash.total' as TranslationKey, value: total },
          { labelKey: 'dash.active' as TranslationKey, value: active, accent: true },
          { labelKey: 'dash.inReview' as TranslationKey, value: pending },
          { labelKey: 'dash.drafts' as TranslationKey, value: drafts },
        ]).map(({ labelKey, value, accent }) => (
          <div
            key={labelKey}
            className="rounded-card border border-border bg-bg-card px-4 py-3"
          >
            <p className="text-2xl font-bold tabular-nums">{value}</p>
            <p className={`mt-0.5 text-xs ${accent ? 'font-medium text-verified' : 'text-text-muted'}`}>
              {t(labelKey)}
            </p>
          </div>
        ))}
      </div>

      {/* Verification CTA — only while unverified. Once verified, the badge next
          to the name (plus the one-time confetti) is the whole story. */}
      {!isVerified && (appUser.role === 'landlord' || appUser.role === 'agent') && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
          <ShieldAlert className="h-5 w-5 shrink-0 text-yellow-600" />
          <div className="flex-1 text-sm">
            <span className="font-medium text-yellow-700">{t('dash.notVerified')}</span>{' '}
            <span className="text-yellow-600">
              {t('dash.notVerifiedCta')}
            </span>
          </div>
          <Link
            to="/verify"
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-yellow-700 hover:text-yellow-900"
          >
            {t('dash.getVerified')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Tabs */}
      {(() => {
        const pendingVisits  = visits?.filter((v) => v.status === 'pending').length ?? 0;
        const paidBookings   = bookings?.filter((b) => b.status === 'paid') ?? [];
        const feesCollected  = paidBookings.reduce((sum, b) => sum + b.bookingFee, 0);
        type TabDef = { id: Tab; label: string; Icon: React.ElementType; badge?: number };
        const tabs: TabDef[] = [
          { id: 'listings', label: t('dash.tabListings'), Icon: Building2    },
          { id: 'visits',   label: t('dash.tabVisits'),   Icon: CalendarDays, badge: pendingVisits || undefined },
          { id: 'bookings', label: t('dash.tabBookings'), Icon: Wallet,       badge: paidBookings.length || undefined },
        ];
        return (
      <div className="mt-8">
        <div className="flex gap-6 border-b border-border sm:gap-8">
          {tabs.map(({ id, label, Icon, badge }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                tab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {badge ? (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ── Listings tab ───────────────────────────────────────────── */}
        {tab === 'listings' && (
          <div className="mt-6">
            {listingsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
              </div>
            ) : !listings || listings.length === 0 ? (
              <EmptyState
                icon={<LayoutGrid className="h-10 w-10" />}
                title={t('dash.emptyListings')}
                description={t('dash.emptyListingsDesc')}
                action={
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setView('add')}
                  >
                    {t('dash.createFirst')}
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {listings.map((listing) => (
                  <MyListingCard
                    key={listing.id}
                    listing={listing}
                    onEdit={(l) => setView({ mode: 'edit', listing: l })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Visits tab ─────────────────────────────────────────────── */}
        {tab === 'visits' && (
          <div className="mt-6">
            {visitsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
              </div>
            ) : !visits || visits.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="h-10 w-10" />}
                title={t('dash.emptyVisitsTitle')}
                description={t('dash.emptyVisitsDesc')}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visits.map((visit) => (
                  <VisitRequestCard key={visit.id} request={visit} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Bookings tab ───────────────────────────────────────────── */}
        {tab === 'bookings' && (
          <div className="mt-6">
            {/* Earnings summary */}
            {paidBookings.length > 0 && (
              <div className="mb-5 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                    {t('dash.feesCollected')}
                  </p>
                  <p className="mt-0.5 font-heading text-2xl font-bold text-emerald-800 tabular-nums">
                    {formatFcfa(feesCollected)}
                  </p>
                </div>
                <p className="text-sm text-emerald-700">
                  {paidBookings.length} {t('dash.paidBookings')}
                </p>
              </div>
            )}

            {bookingsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-text-muted" />
              </div>
            ) : !bookings || bookings.length === 0 ? (
              <EmptyState
                icon={<Wallet className="h-10 w-10" />}
                title={t('dash.emptyBookingsTitle')}
                description={t('dash.emptyBookingsDesc')}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bookings.map((booking) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
        ); })()}
    </div>
  );
}
