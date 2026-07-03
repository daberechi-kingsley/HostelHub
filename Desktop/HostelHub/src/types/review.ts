/**
 * A student's review of a listing.
 *
 * Doc ID: `${authorId}_${listingId}` — one review per student per listing,
 * O(1) duplicate check, no composite index.
 *
 * The listing's `rating` / `reviewCount` aggregates are recomputed by the
 * `onReviewCreated` Cloud Function trigger — never trusted from the client.
 */
export interface Review {
  id: string;
  listingId: string;
  authorId: string;
  authorName: string;
  rating: number;       // 1–5
  text: string;         // max 500 chars
  createdAt: number;
}
