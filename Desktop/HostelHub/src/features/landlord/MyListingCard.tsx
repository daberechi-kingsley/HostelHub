import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Send, Eye, Loader2, ImageOff, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import ListingStatusBadge from './ListingStatusBadge';
import { useSubmitForReview, useDeleteListing } from './hooks';
import { formatFcfaCompact } from '@/lib/format/money';
import { useT } from '@/i18n/useT';
import { useTypeLabel } from '@/i18n/labels';
import type { Listing } from '@/types/listing';

interface MyListingCardProps {
  listing: Listing;
  onEdit: (listing: Listing) => void;
}

export default function MyListingCard({ listing, onEdit }: MyListingCardProps) {
  const t = useT();
  const typeLabel = useTypeLabel();
  const submitMutation = useSubmitForReview();
  const deleteMutation = useDeleteListing();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isDraft    = listing.status === 'draft';
  const isPending  = listing.status === 'pending';
  const isActive   = listing.status === 'active';
  const isRejected = listing.status === 'rejected';

  // Owner can edit anytime except while it's under admin review; delete anytime.
  const canEdit = isDraft || isActive || isRejected;

  async function handleSubmit() {
    await submitMutation.mutateAsync(listing.id);
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    await deleteMutation.mutateAsync(listing.id);
  }

  const isBusy = submitMutation.isPending || deleteMutation.isPending;

  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-border bg-bg-card transition-shadow hover:shadow-card-hover">
      {/* Photo */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-bg-hover">
        {listing.photos.length > 0 ? (
          <img
            src={listing.photos[0]}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-text-subtle">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <ListingStatusBadge status={listing.status} />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
          {typeLabel(listing.type)}
        </span>
        <h3 className="line-clamp-2 font-heading text-sm font-semibold leading-snug">
          {listing.title}
        </h3>
        <p className="text-xs text-text-muted">{listing.zone} · {listing.address}</p>
        <p className="mt-1 font-heading text-base font-bold text-text">
          {formatFcfaCompact(listing.pricePerYear)}
          <span className="text-xs font-normal text-text-muted">{t('common.perYearShort')}</span>
        </p>

        {/* Admin's rejection reason, surfaced to the landlord */}
        {isRejected && listing.rejectionReason && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-semibold">{t('admin.rejectedPrefix')}:</span> {listing.rejectionReason}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-3">
        {/* ── Left: view + edit ─────────────────────────────────────── */}
        {isActive && (
          <Link
            to={`/listing/${listing.id}`}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-700"
          >
            <Eye className="h-3.5 w-3.5" />
            {t('dash.view')}
          </Link>
        )}

        {canEdit && (
          <button
            type="button"
            onClick={() => onEdit(listing)}
            disabled={isBusy}
            className="flex items-center gap-1 text-xs font-medium text-text hover:text-primary disabled:opacity-50"
          >
            <Edit2 className="h-3.5 w-3.5" />
            {t('common.edit')}
          </button>
        )}

        {isPending && (
          <span className="text-xs text-text-muted">{t('dash.waitingReview')}</span>
        )}

        {/* ── Right: review action + delete ─────────────────────────── */}
        <div className="ml-auto flex items-center gap-2">
          {isDraft && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isBusy}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {t('dash.submitReview')}
            </button>
          )}

          {isRejected && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isBusy}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {submitMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              {t('dash.resubmit')}
            </button>
          )}

          {/* Delete — available for any of the owner's listings */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={isBusy}
            className={clsx(
              'flex items-center gap-1 text-xs font-medium disabled:opacity-50',
              confirmDelete ? 'text-accent-700' : 'text-text-muted hover:text-accent-700',
            )}
            title={confirmDelete ? t('dash.confirmDeleteTitle') : t('dash.deleteTitle')}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            {confirmDelete ? t('dash.confirmDelete') : t('common.delete')}
          </button>
        </div>
      </div>

      {/* Error states */}
      {(submitMutation.isError || deleteMutation.isError) && (
        <p className="px-4 pb-3 text-xs text-accent-700">
          {submitMutation.isError ? t('dash.submitError') : t('dash.deleteError')}
        </p>
      )}
    </div>
  );
}
