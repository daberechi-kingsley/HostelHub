/**
 * Inline-SVG brand badges for the two Cameroon mobile-money providers.
 * Drawn in-code (no copyrighted bitmap assets shipped) but styled with the
 * official brand colours so they're instantly recognisable:
 *   MTN MoMo     → #FFCC00 yellow + navy oval wordmark
 *   Orange Money → #FF7900 orange + white lowercase wordmark
 */
import { clsx } from 'clsx';
import type { PaymentMethod } from '@/types/booking';

export function MtnMomoLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#FFCC00" />
      <ellipse cx="32" cy="26" rx="22" ry="12" fill="#004F9F" />
      <text
        x="32"
        y="30.5"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize="13"
        fill="#FFCC00"
      >
        MTN
      </text>
      <text
        x="32"
        y="50"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="bold"
        fontSize="11"
        fill="#1A1A1A"
      >
        MoMo
      </text>
    </svg>
  );
}

export function OrangeMoneyLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#FF7900" />
      <text
        x="32"
        y="32"
        textAnchor="middle"
        fontFamily="Helvetica, Arial, sans-serif"
        fontWeight="bold"
        fontSize="14"
        fill="#FFFFFF"
      >
        orange
      </text>
      <text
        x="32"
        y="48"
        textAnchor="middle"
        fontFamily="Helvetica, Arial, sans-serif"
        fontWeight="bold"
        fontSize="11"
        fill="#1A1A1A"
      >
        Money™
      </text>
    </svg>
  );
}

export function PaymentLogo({
  method,
  className,
}: {
  method: PaymentMethod;
  className?: string;
}) {
  return method === 'mtn_momo' ? (
    <MtnMomoLogo className={className} />
  ) : (
    <OrangeMoneyLogo className={className} />
  );
}

/**
 * Selectable payment-method tile for the booking sheet.
 */
export function PaymentMethodTile({
  method,
  selected,
  onSelect,
}: {
  method: PaymentMethod;
  selected: boolean;
  onSelect: () => void;
}) {
  const isMtn = method === 'mtn_momo';
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        'flex flex-col items-center gap-2.5 rounded-2xl border-2 p-4 transition-all',
        selected
          ? isMtn
            ? 'border-[#FFCC00] bg-[#FFCC00]/10 shadow-sm'
            : 'border-[#FF7900] bg-[#FF7900]/10 shadow-sm'
          : 'border-border bg-bg-card hover:border-text-muted/40',
      )}
    >
      <PaymentLogo method={method} className="h-12 w-12" />
      <span className={clsx('text-sm font-semibold', selected ? 'text-text' : 'text-text-muted')}>
        {isMtn ? 'MTN MoMo' : 'Orange Money'}
      </span>
      <span
        className={clsx(
          'h-4 w-4 rounded-full border-2 transition-colors',
          selected
            ? isMtn
              ? 'border-[#E6B800] bg-[#FFCC00]'
              : 'border-[#E66D00] bg-[#FF7900]'
            : 'border-border bg-bg',
        )}
      />
    </button>
  );
}
