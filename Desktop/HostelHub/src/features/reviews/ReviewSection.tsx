/**
 * Reviews block on the listing detail page:
 *   • average rating header (live from listing aggregates)
 *   • review list
 *   • "Write a review" form — signed-in users, one review per listing
 *
 * TODO(post-launch): gate review writing on a paid booking + 14-day
 * Cloud Scheduler prompt (plan §week-4). For v1 any signed-in user may review.
 */
import { useState } from 'react';
import { MessageSquarePlus, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { StarDisplay, StarInput } from './StarRating';
import { useListingReviews, useMyReview, useAddReview } from './hooks';
import { useUser } from '@/hooks/useUser';
import { useAuthModalStore } from '@/stores/authModalStore';
import type { Listing } from '@/types/listing';

function timeAgo(ms: number): string {
  const days = Math.floor((Date.now() - ms) / 86_400_000);
  if (days < 1)   return 'today';
  if (days < 30)  return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default function ReviewSection({ listing }: { listing: Listing }) {
  const { isSignedIn } = useUser();
  const showAuth = useAuthModalStore((s) => s.show);
  const { data: reviews, isLoading } = useListingReviews(listing.id);
  const { data: myReview } = useMyReview(listing.id);
  const addReview = useAddReview(listing.id);

  const [writing, setWriting] = useState(false);
  const [rating,  setRating]  = useState(0);
  const [text,    setText]    = useState('');
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (rating === 0) {
      setError('Tap a star to rate first.');
      return;
    }
    try {
      await addReview.mutateAsync({ rating, text });
      setWriting(false);
      setRating(0);
      setText('');
    } catch {
      setError('Could not post your review. Try again.');
    }
  }

  function handleWriteClick() {
    if (!isSignedIn) {
      showAuth('signin');
      return;
    }
    setWriting(true);
  }

  return (
    <section className="mt-8 rounded-card border border-border bg-bg-card p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold">Reviews</h2>
          <div className="mt-1 flex items-center gap-2 text-sm text-text-muted">
            <StarDisplay rating={listing.rating} />
            <span className="font-medium text-text">{listing.rating.toFixed(1)}</span>
            <span>· {listing.reviewCount} review{listing.reviewCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {!myReview && !writing && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<MessageSquarePlus className="h-4 w-4" />}
            onClick={handleWriteClick}
          >
            Write a review
          </Button>
        )}
      </div>

      {/* Write form */}
      {writing && !myReview && (
        <div className="mt-4 rounded-2xl border border-border bg-bg p-4">
          <p className="text-sm font-medium">Your rating</p>
          <div className="mt-2">
            <StarInput value={rating} onChange={setRating} disabled={addReview.isPending} />
          </div>

          <textarea
            rows={3}
            maxLength={500}
            placeholder="How was the room, the landlord, the area? (optional)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="mt-3 w-full resize-none rounded-xl border border-border bg-bg-card px-4 py-3 text-sm outline-none focus:border-primary"
          />

          {error && (
            <p className="mt-2 rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-700">{error}</p>
          )}

          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => { setWriting(false); setError(null); }}
              disabled={addReview.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              fullWidth
              onClick={handleSubmit}
              disabled={addReview.isPending}
            >
              {addReview.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Post review'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* My review notice */}
      {myReview && (
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary">Your review</p>
            <StarDisplay rating={myReview.rating} />
          </div>
          {myReview.text && (
            <p className="mt-1 text-sm text-text-muted">{myReview.text}</p>
          )}
        </div>
      )}

      {/* List */}
      <div className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
          </div>
        ) : !reviews || reviews.length === 0 ? (
          <p className="py-4 text-center text-sm text-text-muted">
            No reviews yet — be the first to share your experience.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {reviews
              .filter((r) => r.id !== myReview?.id)
              .map((r) => (
                <li key={r.id} className="py-4 first:pt-2 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {(r.authorName || 'S').charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate text-sm font-semibold">{r.authorName}</span>
                    </div>
                    <span className="shrink-0 text-xs text-text-muted">{timeAgo(r.createdAt)}</span>
                  </div>
                  <div className="mt-1.5">
                    <StarDisplay rating={r.rating} />
                  </div>
                  {r.text && (
                    <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{r.text}</p>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>
    </section>
  );
}
