/**
 * Admin pending-listings panel — review, approve, or reject listings awaiting
 * activation. Approve flips the listing live; reject records a reason that's
 * surfaced to the landlord in their dashboard.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Inbox, Loader2, XCircle } from 'lucide-react';
import { usePendingListings, useListingReviewActions } from './useAdminData';
import { formatFcfa } from '@/lib/format/money';
import { formatDistance } from '@/lib/format/distance';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/feedback/EmptyState';
import PageSpinner from '@/components/feedback/PageSpinner';
import { useT } from '@/i18n/useT';
import { useTypeLabel } from '@/i18n/labels';
import type { Listing } from '@/types/listing';

function PendingRow({ listing }: { listing: Listing }) {
  const { approve, reject } = useListingReviewActions();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const t = useT();
  const typeLabel = useTypeLabel();

  const busy = approve.isPending || reject.isPending;

  return (
    <li className="rounded-card border border-border bg-bg-card p-4">
      <div className="flex items-center gap-4">
        {listing.photos.length > 0 ? (
          <img
            src={listing.photos[0]}
            alt=""
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-bg text-text-subtle">
            <Inbox className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link
            to={`/listing/${listing.id}`}
            className="truncate font-semibold text-text hover:text-primary"
          >
            {listing.title}
          </Link>
          <p className="text-xs text-text-muted">
            {typeLabel(listing.type)} · {listing.zone} ·{' '}
            {formatDistance(listing.distanceFromUbMeters)} {t('common.toUb')}
          </p>
          <p className="text-sm font-medium text-text">
            {formatFcfa(listing.pricePerYear)}{t('common.perYearShort')}
          </p>
        </div>
        {!rejecting && (
          <div className="flex shrink-0 gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={busy}
              leftIcon={
                approve.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )
              }
              onClick={() => approve.mutate(listing.id)}
            >
              {t('admin.approve')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              leftIcon={<XCircle className="h-4 w-4" />}
              onClick={() => setRejecting(true)}
            >
              {t('admin.reject')}
            </Button>
          </div>
        )}
      </div>

      {/* Rejection reason input */}
      {rejecting && (
        <div className="mt-4 space-y-2 border-t border-border pt-4">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder={t('admin.rejectReasonListing')}
            className="w-full resize-none rounded-lg border border-border bg-bg px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={busy || !reason.trim()}
              onClick={() =>
                reject.mutate(
                  { id: listing.id, reason: reason.trim() },
                  { onSuccess: () => setRejecting(false) },
                )
              }
            >
              {reject.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('admin.confirmRejection')
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                setRejecting(false);
                setReason('');
              }}
            >
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function PendingListings() {
  const t = useT();
  const { data: listings, isLoading, isError } = usePendingListings();

  if (isLoading) return <PageSpinner />;

  if (isError) {
    return (
      <EmptyState
        title={t('admin.noPendingListingsTitle')}
        description={t('admin.noPendingListingsDesc')}
      />
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-10 w-10" />}
        title={t('admin.noPendingListingsTitle')}
        description={t('admin.noPendingListingsDesc')}
      />
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-text-muted">{listings.length} · {t('admin.tabListings')}</p>
      <ul className="space-y-3">
        {listings.map((listing) => (
          <PendingRow key={listing.id} listing={listing} />
        ))}
      </ul>
    </div>
  );
}
