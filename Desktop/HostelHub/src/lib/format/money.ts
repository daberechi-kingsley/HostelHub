/** Format a FCFA amount with thousand separators and the FCFA suffix. */
export function formatFcfa(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  return `${amount.toLocaleString('en-US')} FCFA`;
}

/** Compact form: 250,000 → "250k", 1,200,000 → "1.2M". For listing cards. */
export function formatFcfaCompact(amount: number): string {
  if (!Number.isFinite(amount)) return '—';
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M FCFA`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}k FCFA`;
  }
  return `${amount} FCFA`;
}
