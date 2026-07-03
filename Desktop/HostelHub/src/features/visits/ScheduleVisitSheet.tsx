/**
 * Bottom sheet for students to schedule (or reschedule / cancel) a visit.
 *
 * States handled:
 *   • No existing request → show the booking form
 *   • Existing pending    → show summary + cancel / reschedule options
 *   • Confirmed           → show confirmed details
 *   • Declined            → show landlord note + option to reschedule
 *   • Cancelled           → show reschedule form
 */
import { useEffect, useState, type FormEvent } from 'react';
import { X, Calendar, Clock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import VisitStatusBadge from './VisitStatusBadge';
import { useMyVisitRequest, useSetVisitRequest, useCancelVisit } from './hooks';
import { VISIT_SLOTS, type VisitSlot } from './api';
import type { Listing } from '@/types/listing';

interface Props {
  listing: Listing;
  open: boolean;
  onClose: () => void;
}

/** Format 'YYYY-MM-DD' → 'Monday, 12 June 2026' */
function prettyDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Today's date + 1 in 'YYYY-MM-DD' format for the date input's min. */
function minDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0]!;
}

/** 3 months from now for the date input's max. */
function maxDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().split('T')[0]!;
}

export default function ScheduleVisitSheet({ listing, open, onClose }: Props) {
  const { data: existing, isLoading: existingLoading } = useMyVisitRequest(listing.id);
  const setRequest = useSetVisitRequest(listing.id);
  const cancelMutation = useCancelVisit(listing.id);

  const [date,    setDate]    = useState('');
  const [slot,    setSlot]    = useState<VisitSlot>(VISIT_SLOTS[2]!);
  const [message, setMessage] = useState('');
  const [mode,    setMode]    = useState<'view' | 'form'>('view');
  const [error,   setError]   = useState<string | null>(null);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Reset form state when sheet opens
  useEffect(() => {
    if (open) {
      setDate('');
      setSlot(VISIT_SLOTS[2]!);
      setMessage('');
      setError(null);
      // If there's no existing request (or cancelled/declined), go straight to form
      setMode('view');
    }
  }, [open]);

  if (!open) return null;

  const isBusy = setRequest.isPending || cancelMutation.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!date)  { setError('Pick a date.'); return; }

    try {
      await setRequest.mutateAsync({
        landlordId:   listing.ownerId,
        listingTitle: listing.title,
        proposedDate: date,
        proposedSlot: slot,
        message:      message.trim(),
      });
      setMode('view'); // switches to the "pending" summary view
    } catch {
      setError('Could not send your request. Try again.');
    }
  }

  async function handleCancel() {
    if (!existing) return;
    try {
      await cancelMutation.mutateAsync(existing.id);
      onClose();
    } catch {
      setError('Could not cancel. Try again.');
    }
  }

  // ── Which UI panel to show ──────────────────────────────────────────────
  const showForm =
    mode === 'form' ||
    !existing ||
    existing.status === 'cancelled' ||
    existing.status === 'declined';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Schedule a visit"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-bg-card p-6 shadow-xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="pr-8">
            <h2 className="font-heading text-xl font-bold">Schedule a visit</h2>
            <p className="mt-0.5 text-sm text-text-muted line-clamp-1">{listing.title}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 text-text-muted hover:bg-bg-hover"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5">
          {existingLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>

          ) : showForm ? (
            /* ── Booking form ─────────────────────────────────────────── */
            <form onSubmit={handleSubmit} className="space-y-4">
              {existing?.status === 'declined' && existing.responseNote && (
                <div className="flex items-start gap-2 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm text-accent-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <span className="font-medium">Previous request declined.</span>
                    {' '}{existing.responseNote}
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="visit-date">
                  Preferred date <span className="text-accent-700">*</span>
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-4 py-3 focus-within:border-primary">
                  <Calendar className="h-4 w-4 shrink-0 text-text-muted" />
                  <input
                    id="visit-date"
                    type="date"
                    required
                    min={minDate()}
                    max={maxDate()}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              {/* Time slot */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="visit-slot">
                  Preferred time
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-4 py-3 focus-within:border-primary">
                  <Clock className="h-4 w-4 shrink-0 text-text-muted" />
                  <select
                    id="visit-slot"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value as VisitSlot)}
                    className="w-full bg-transparent text-sm outline-none"
                  >
                    {VISIT_SLOTS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="visit-msg">
                  Message <span className="text-text-muted text-xs">(optional)</span>
                </label>
                <textarea
                  id="visit-msg"
                  rows={3}
                  maxLength={300}
                  placeholder="Introduce yourself or ask a question…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>
              )}

              <Button type="submit" variant="primary" fullWidth size="lg" disabled={isBusy}>
                {isBusy ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </span>
                ) : (
                  'Send visit request'
                )}
              </Button>
            </form>

          ) : existing.status === 'confirmed' ? (
            /* ── Confirmed state ──────────────────────────────────────── */
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-800">Visit confirmed!</p>
                  <p className="text-sm text-emerald-700">
                    {prettyDate(existing.proposedDate)} · {existing.proposedSlot}
                  </p>
                  {existing.responseNote && (
                    <p className="mt-1 text-sm text-emerald-700">
                      Note from landlord: {existing.responseNote}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-text-muted text-center">
                Can't make it? Cancel and send a new request anytime.
              </p>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handleCancel}
                disabled={isBusy}
              >
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel this visit'}
              </Button>
            </div>

          ) : (
            /* ── Pending state ────────────────────────────────────────── */
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-4">
                <VisitStatusBadge status="pending" />
                <div>
                  <p className="text-sm font-semibold text-yellow-800">
                    Request sent — waiting for landlord
                  </p>
                  <p className="mt-1 text-sm text-yellow-700">
                    <span className="font-medium">{prettyDate(existing.proposedDate)}</span>
                    {' · '}{existing.proposedSlot}
                  </p>
                  {existing.message && (
                    <p className="mt-1 text-xs text-yellow-600 italic">"{existing.message}"</p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => setMode('form')}
                  disabled={isBusy}
                >
                  Reschedule
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={handleCancel}
                  disabled={isBusy}
                  className="text-accent-700 hover:bg-accent-50"
                >
                  {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel request'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
