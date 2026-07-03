import { Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { useSaves } from './useSaves';
import { useLazyAuth } from '@/hooks/useLazyAuth';
import type { MouseEvent } from 'react';

interface SaveHeartProps {
  listingId: string;
  size?: 'sm' | 'md';
  variant?: 'overlay' | 'plain';
}

/**
 * Heart toggle that gates on auth.
 * - Anonymous users → lazy-auth modal is shown first, then save on success.
 * - Signed-in users → optimistic Firestore save (useSaves hook).
 * Used on cards (overlay variant) and detail pages (plain variant).
 */
export default function SaveHeart({
  listingId,
  size = 'md',
  variant = 'overlay',
}: SaveHeartProps) {
  const { isSaved: isSavedFn, toggle } = useSaves();
  const isSaved = isSavedFn(listingId);
  const { require } = useLazyAuth();

  function handleClick(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    // Signed in → toggle Firestore save. Anonymous → show auth modal, then toggle.
    require('save', () => toggle(listingId));
  }

  const dims = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  if (variant === 'overlay') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={isSaved ? 'Remove from saves' : 'Save listing'}
        aria-pressed={isSaved}
        className="absolute right-2 top-2 z-10 rounded-full bg-white/95 p-1.5 shadow-md ring-1 ring-black/10 backdrop-blur-sm transition hover:bg-white sm:right-3 sm:top-3 sm:p-2"
      >
        <Heart
          className={clsx(dims, isSaved ? 'fill-accent text-accent' : 'text-gray-700')}
          strokeWidth={2}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSaved ? 'Remove from saves' : 'Save listing'}
      aria-pressed={isSaved}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-card hover:bg-bg-hover"
    >
      <Heart
        className={clsx(dims, isSaved ? 'fill-accent text-accent' : 'text-text')}
        strokeWidth={2}
      />
    </button>
  );
}
