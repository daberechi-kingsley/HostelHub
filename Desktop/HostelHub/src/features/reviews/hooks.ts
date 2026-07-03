import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import { fetchListingReviews, getMyReview, addReview } from './api';

/** All reviews for a listing, newest first. */
export function useListingReviews(listingId: string) {
  return useQuery({
    queryKey: ['reviews', listingId],
    queryFn:  () => fetchListingReviews(listingId),
    enabled:  Boolean(listingId),
  });
}

/** The current user's review for this listing (null if none yet). */
export function useMyReview(listingId: string) {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid ?? '';
  return useQuery({
    queryKey: ['myReview', uid, listingId],
    queryFn:  () => getMyReview(uid, listingId),
    enabled:  Boolean(uid) && Boolean(listingId),
  });
}

/** Submit a review for a listing. */
export function useAddReview(listingId: string) {
  const qc = useQueryClient();
  const { firebaseUser, appUser } = useUser();

  return useMutation({
    mutationFn: (params: { rating: number; text: string }) => {
      if (!firebaseUser) return Promise.reject(new Error('Not signed in'));
      return addReview({
        authorId:   firebaseUser.uid,
        authorName: appUser?.displayName ?? firebaseUser.displayName ?? 'Student',
        listingId,
        ...params,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reviews', listingId] });
      if (firebaseUser) {
        qc.invalidateQueries({ queryKey: ['myReview', firebaseUser.uid, listingId] });
      }
      // Aggregate rating on the listing is recomputed server-side shortly after
      qc.invalidateQueries({ queryKey: ['listing', listingId] });
    },
  });
}
