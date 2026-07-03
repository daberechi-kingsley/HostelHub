import { Link } from 'react-router-dom';
import { MapPin, Star, BarChart2 } from 'lucide-react';
import { clsx } from 'clsx';
import { formatFcfaCompact } from '@/lib/format/money';
import { formatDistance } from '@/lib/format/distance';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import SaveHeart from '@/features/saves/SaveHeart';
import { useCompareStore } from '@/stores/compareStore';
import { useT } from '@/i18n/useT';
import { useTypeLabel } from '@/i18n/labels';
import type { Listing } from '@/types/listing';

interface ListingCardProps {
  listing: Listing;
  className?: string;
}

export default function ListingCard({ listing, className }: ListingCardProps) {
  const cover = listing.photos[0] ?? '/placeholder.jpg';
  const isInCompare = useCompareStore((s) => s.has(listing.id));
  const isFull = useCompareStore((s) => s.isFull());
  const toggleCompare = useCompareStore((s) => s.toggle);
  const t = useT();
  const typeLabel = useTypeLabel();

  return (
    <article
      className={clsx(
        'group relative overflow-hidden rounded-card bg-bg-card shadow-card transition hover:shadow-card-hover',
        className,
      )}
    >
      <Link to={`/listing/${listing.id}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-bg-hover">
          <img
            src={cover}
            alt={listing.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <SaveHeart listingId={listing.id} />
          {/* Compare toggle — top-left, opposite SaveHeart */}
          <button
            type="button"
            aria-label={isInCompare ? 'Remove from compare' : 'Add to compare'}
            aria-pressed={isInCompare}
            disabled={!isInCompare && isFull}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleCompare(listing.id);
            }}
            className={clsx(
              'absolute left-3 top-3 z-10 hidden rounded-full bg-white/95 p-2 shadow-md ring-1 ring-black/10 backdrop-blur-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 sm:block',
            )}
          >
            <BarChart2
              className={clsx('h-4 w-4', isInCompare ? 'text-primary' : 'text-gray-600')}
              strokeWidth={2}
            />
          </button>
          {listing.verified ? (
            <div className="absolute bottom-2 left-2 z-10 sm:bottom-3 sm:left-3">
              <VerifiedBadge />
            </div>
          ) : null}
        </div>

        <div className="space-y-1 p-2.5 sm:space-y-1.5 sm:p-4">
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="line-clamp-1 font-heading text-sm font-semibold text-text sm:text-base">
              {listing.title}
            </h3>
            <div className="flex shrink-0 items-center gap-0.5 text-xs text-text sm:gap-1 sm:text-sm">
              <Star className="h-3 w-3 fill-accent text-accent sm:h-3.5 sm:w-3.5" strokeWidth={1.5} />
              <span className="font-medium">{listing.rating.toFixed(1)}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-text-muted sm:gap-1.5 sm:text-sm">
            <MapPin className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" strokeWidth={2} />
            <span className="truncate">{listing.zone}</span>
            <span className="hidden text-text-subtle min-[480px]:inline">·</span>
            <span className="hidden shrink-0 min-[480px]:inline">
              {formatDistance(listing.distanceFromUbMeters)} {t('common.toUb')}
            </span>
          </div>

          <div className="flex items-baseline gap-1 pt-0.5 sm:pt-1">
            <span className="hidden truncate text-2xs font-medium uppercase tracking-wide text-text-muted min-[440px]:inline-block sm:text-xs">
              {typeLabel(listing.type)}
            </span>
            <div className="ml-auto shrink-0">
              <span className="font-heading text-base font-bold text-text sm:text-lg">
                {formatFcfaCompact(listing.pricePerYear)}
              </span>
              <span className="ml-0.5 text-2xs text-text-muted sm:ml-1 sm:text-xs">{t('common.perYearShort')}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
