/**
 * Star rating — display (read-only) and input (interactive) modes.
 */
import { useState } from 'react';
import { Star } from 'lucide-react';
import { clsx } from 'clsx';

export function StarDisplay({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-0.5', className)} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={clsx(
            'h-4 w-4',
            i <= Math.round(rating)
              ? 'fill-accent text-accent'
              : 'fill-none text-border',
          )}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export function StarInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      role="radiogroup"
      aria-label="Rating"
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
          disabled={disabled}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          className="rounded p-0.5 transition-transform hover:scale-110 disabled:opacity-50"
        >
          <Star
            className={clsx(
              'h-7 w-7 transition-colors',
              i <= shown ? 'fill-accent text-accent' : 'fill-none text-border',
            )}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}
