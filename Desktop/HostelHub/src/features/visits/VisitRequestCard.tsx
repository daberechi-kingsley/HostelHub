/**
 * Card shown on the Landlord Dashboard "Visits" tab.
 * Displays one student visit request with confirm / decline actions.
 */
import { useState } from 'react';
import { Calendar, Clock, User, CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import VisitStatusBadge from './VisitStatusBadge';
import { useRespondToVisit } from './hooks';
import type { VisitRequest } from '@/types/inquiry';

interface Props {
  request: VisitRequest;
}

/** 'YYYY-MM-DD' → 'Mon 12 Jun 2026' */
function shortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Relative time since epoch ms → '2 hours ago' etc. */
function relativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function VisitRequestCard({ request }: Props) {
  const respond = useRespondToVisit();
  const [expanded,    setExpanded]    = useState(false);
  const [note,        setNote]        = useState('');
  const [action,      setAction]      = useState<'confirm' | 'decline' | null>(null);
  const [localError,  setLocalError]  = useState<string | null>(null);

  const isPending = request.status === 'pending';
  const isBusy    = respond.isPending;

  async function handleRespond(status: 'confirmed' | 'declined') {
    setLocalError(null);
    try {
      await respond.mutateAsync({ inquiryId: request.id, status, note });
      setAction(null);
      setNote('');
    } catch {
      setLocalError('Could not save response. Please try again.');
    }
  }

  return (
    <article
      className={clsx(
        'rounded-2xl border bg-bg-card transition-shadow hover:shadow-md',
        request.status === 'pending'   && 'border-yellow-200',
        request.status === 'confirmed' && 'border-emerald-200',
        request.status === 'declined'  && 'border-border',
        request.status === 'cancelled' && 'border-border opacity-60',
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-hover text-text-muted">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">{request.studentName}</p>
            <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{request.listingTitle}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <VisitStatusBadge status={request.status} />
          <span className="text-xs text-text-muted">{relativeTime(request.createdAt)}</span>
        </div>
      </div>

      {/* Date + slot */}
      <div className="mt-3 flex items-center gap-4 px-4 text-sm text-text-muted">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 shrink-0" />
          {shortDate(request.proposedDate)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 shrink-0" />
          {request.proposedSlot}
        </span>
      </div>

      {/* Message (if any) */}
      {request.message && (
        <p className="mt-3 px-4 text-sm text-text-muted italic line-clamp-2">
          "{request.message}"
        </p>
      )}

      {/* Response note (confirmed / declined) */}
      {!isPending && request.responseNote && (
        <div
          className={clsx(
            'mx-4 mt-3 rounded-xl px-3 py-2 text-sm',
            request.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-bg-hover text-text-muted',
          )}
        >
          Your note: {request.responseNote}
        </div>
      )}

      {/* Confirm / decline UI for pending requests */}
      {isPending && (
        <div className="mt-3 px-4 pb-4 space-y-3">
          {/* Toggle detail row */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex w-full items-center gap-1 text-xs text-primary font-medium"
          >
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {expanded ? 'Hide' : 'Add a note (optional)'}
          </button>

          {expanded && (
            <textarea
              rows={2}
              maxLength={200}
              placeholder="Optional note to the student (e.g. 'Come to Gate 2')…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          )}

          {localError && (
            <p className="text-xs text-accent-700">{localError}</p>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="primary"
              fullWidth
              disabled={isBusy}
              onClick={() => { setAction('confirm'); handleRespond('confirmed'); }}
            >
              {isBusy && action === 'confirm'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><CheckCircle2 className="h-4 w-4" /> Confirm</>
              }
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              fullWidth
              disabled={isBusy}
              onClick={() => { setAction('decline'); handleRespond('declined'); }}
              className="border-accent-200 text-accent-700 hover:bg-accent-50"
            >
              {isBusy && action === 'decline'
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <><XCircle className="h-4 w-4" /> Decline</>
              }
            </Button>
          </div>
        </div>
      )}

      {/* Empty bottom padding when non-pending */}
      {!isPending && <div className="pb-4" />}
    </article>
  );
}
