import { clsx } from 'clsx';
import { Home, AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import ListingCard from './ListingCard';
import ListingCardSkeleton from './ListingCardSkeleton';
import EmptyState from '@/components/feedback/EmptyState';
import type { Listing } from '@/types/listing';

interface ListingGridProps {
  listings: Listing[] | undefined;
  loading: boolean;
  error?: boolean;
  columns?: 3 | 4;
  skeletonCount?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

// Mobile is always 2-up (compact, Airbnb-style); wider screens add columns.
const COLS: Record<3 | 4, string> = {
  3: 'lg:grid-cols-3',
  4: 'md:grid-cols-3 lg:grid-cols-4',
};

/**
 * One place to handle the loading / error / empty / success states of any
 * listing collection. Pass a React Query result straight through.
 */
export default function ListingGrid({
  listings,
  loading,
  error = false,
  columns = 3,
  skeletonCount = 6,
  emptyTitle = 'No listings yet',
  emptyDescription = 'Check back soon — new rooms are added regularly.',
  emptyAction,
}: ListingGridProps) {
  if (loading) {
    return (
      <div className={clsx('grid grid-cols-2 gap-3 sm:gap-5', COLS[columns])}>
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-10 w-10" />}
        title="Couldn't load listings"
        description="Something went wrong reaching the server. Check your connection and try again."
      />
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <EmptyState
        icon={<Home className="h-10 w-10" />}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={clsx('grid grid-cols-2 gap-3 sm:gap-5', COLS[columns])}>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
