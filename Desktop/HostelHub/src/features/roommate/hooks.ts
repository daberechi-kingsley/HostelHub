import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import {
  getMyRoommateProfile,
  saveRoommateProfile,
  setRoommateActive,
  fetchRoommateMatches,
} from './api';
import type { RoommateProfile } from '@/types/roommate';

// ── Profile ───────────────────────────────────────────────────────────────────

/** O(1) direct read of the current user's roommate profile. */
export function useMyRoommateProfile() {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid ?? '';
  return useQuery({
    queryKey: ['roommateProfile', uid],
    queryFn:  () => getMyRoommateProfile(uid),
    enabled:  Boolean(uid),
  });
}

/** Create or fully overwrite the current user's roommate profile. */
export function useSaveRoommateProfile() {
  const qc = useQueryClient();
  const { firebaseUser } = useUser();

  return useMutation({
    mutationFn: (data: Omit<RoommateProfile, 'uid' | 'updatedAt' | 'active'>) => {
      if (!firebaseUser) return Promise.reject(new Error('Not signed in'));
      return saveRoommateProfile(firebaseUser.uid, data);
    },
    onSuccess: () => {
      if (firebaseUser) {
        qc.invalidateQueries({ queryKey: ['roommateProfile', firebaseUser.uid] });
      }
    },
  });
}

/** Toggle visibility in the matching pool (active on/off). */
export function useSetRoommateActive() {
  const qc = useQueryClient();
  const { firebaseUser } = useUser();

  return useMutation({
    mutationFn: (active: boolean) => {
      if (!firebaseUser) return Promise.reject(new Error('Not signed in'));
      return setRoommateActive(firebaseUser.uid, active);
    },
    onSuccess: () => {
      if (firebaseUser) {
        qc.invalidateQueries({ queryKey: ['roommateProfile', firebaseUser.uid] });
      }
    },
  });
}

// ── AI Matching ───────────────────────────────────────────────────────────────

/**
 * Calls the `aiRoommateMatch` Cloud Function on demand.
 * Use `mutate()` / `mutateAsync()` — not a passive query.
 */
export function useRoommateMatches() {
  return useMutation({
    mutationFn: fetchRoommateMatches,
  });
}
