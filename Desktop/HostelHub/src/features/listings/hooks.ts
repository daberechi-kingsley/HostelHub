/**
 * React Query hooks for listings. Components use these — never call the
 * api.ts functions directly from a component.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchActiveListings, fetchListingById, fetchListingsByIds } from './api';

/** All active listings, newest first. */
export function useListings() {
  return useQuery({
    queryKey: ['listings', 'active'],
    queryFn: fetchActiveListings,
  });
}

/** A single listing by id. Disabled until an id is provided. */
export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListingById(id!),
    enabled: Boolean(id),
  });
}

/** Listings for a set of ids (saves / compare). Re-runs when the id set changes. */
export function useListingsByIds(ids: string[]) {
  return useQuery({
    queryKey: ['listings', 'byIds', [...ids].sort()],
    queryFn: () => fetchListingsByIds(ids),
  });
}
