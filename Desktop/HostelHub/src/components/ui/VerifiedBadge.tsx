import { ShieldCheck } from 'lucide-react';
import { clsx } from 'clsx';

interface VerifiedBadgeProps {
  label?: string;
  className?: string;
}

export default function VerifiedBadge({ label = 'Verified', className }: VerifiedBadgeProps) {
  return (
    <span className={clsx('badge-verified', className)}>
      <ShieldCheck className="h-3 w-3" strokeWidth={2.5} />
      {label}
    </span>
  );
}
