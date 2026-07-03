import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import {
  fetchMyListings,
  createListing,
  updateListing,
  deleteListing,
  submitListingForReview,
  type ListingFormData,
} from './api';

const MY_LISTINGS_KEY = (uid: string) => ['myListings', uid];

/** All listings owned by the current user. */
export function useMyListings() {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid ?? '';
  return useQuery({
    queryKey: MY_LISTINGS_KEY(uid),
    queryFn: () => fetchMyListings(uid),
    enabled: Boolean(uid),
  });
}

/** Create a new draft listing. Invalidates the my-listings cache on success. */
export function useCreateListing() {
  const qc = useQueryClient();
  const { firebaseUser, appUser } = useUser();

  return useMutation({
    mutationFn: (data: ListingFormData) => {
      if (!firebaseUser || !appUser) return Promise.reject(new Error('Not signed in'));
      const ownerRole = appUser.role === 'agent' ? 'agent' : 'landlord';
      return createListing(firebaseUser.uid, ownerRole, data);
    },
    onSuccess: () => {
      if (firebaseUser) qc.invalidateQueries({ queryKey: MY_LISTINGS_KEY(firebaseUser.uid) });
    },
  });
}

/** Update an existing listing's editable fields. */
export function useUpdateListing() {
  const qc = useQueryClient();
  const { firebaseUser } = useUser();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ListingFormData }) =>
      updateListing(id, data),
    onSuccess: () => {
      if (firebaseUser) qc.invalidateQueries({ queryKey: MY_LISTINGS_KEY(firebaseUser.uid) });
      // Edits to an active listing must show up in the public browse too.
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

/** Submit a draft listing for admin review. */
export function useSubmitForReview() {
  const qc = useQueryClient();
  const { firebaseUser } = useUser();

  return useMutation({
    mutationFn: (listingId: string) => submitListingForReview(listingId),
    onSuccess: () => {
      if (firebaseUser) qc.invalidateQueries({ queryKey: MY_LISTINGS_KEY(firebaseUser.uid) });
    },
  });
}

/** Delete one of the owner's listings (any status). */
export function useDeleteListing() {
  const qc = useQueryClient();
  const { firebaseUser } = useUser();

  return useMutation({
    mutationFn: (listingId: string) => deleteListing(listingId),
    onSuccess: () => {
      if (firebaseUser) qc.invalidateQueries({ queryKey: MY_LISTINGS_KEY(firebaseUser.uid) });
      // A deleted active listing must disappear from the public browse too.
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}
