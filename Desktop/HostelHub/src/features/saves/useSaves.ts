/**
 * Unified saves hook — works for both anonymous and signed-in users.
 *
 * Anonymous:  reads/writes localStorage via savesStore (persists across reloads).
 * Signed in:  reads/writes Firestore saves/{uid}/listings/ with optimistic updates.
 *
 * On sign-in:  any localStorage saves are merged into Firestore ONCE per uid,
 *              then the local store is cleared so data lives in one place.
 */
import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import { useSavesStore } from '@/stores/savesStore';
import { fetchSavedIds, saveListing, unsaveListing, mergeLocalSaves } from './api';

export function useSaves() {
  const { firebaseUser, isSignedIn } = useUser();
  const uid = firebaseUser?.uid ?? null;
  const qc = useQueryClient();

  // Anonymous (localStorage) store
  const localIds = useSavesStore((s) => s.ids);
  const localToggle = useSavesStore((s) => s.toggle);
  const localClear = useSavesStore((s) => s.clear);

  // Stable ref so the merge effect always reads the latest local ids
  // without needing them as a dep (avoids re-running on every heart click).
  const localIdsRef = useRef(localIds);
  localIdsRef.current = localIds;

  // Track the last uid we've merged for — reset on sign-out so the next
  // sign-in re-runs the merge.
  const mergedUidRef = useRef<string | null>(null);

  // ── Merge localStorage → Firestore once per sign-in ──────────────────
  useEffect(() => {
    if (!uid || !isSignedIn) {
      mergedUidRef.current = null; // reset so next sign-in merges again
      return;
    }
    if (mergedUidRef.current === uid) return; // already merged for this uid
    mergedUidRef.current = uid;

    const toMerge = localIdsRef.current;
    if (toMerge.length === 0) return;

    mergeLocalSaves(uid, toMerge)
      .then(() => {
        localClear();
        // Invalidate so the Firestore query re-fetches with merged data
        void qc.invalidateQueries({ queryKey: ['saves', uid] });
      })
      .catch((err) => console.error('[useSaves] merge failed', err));
  }, [uid, isSignedIn, localClear, qc]);

  // ── Firestore query (signed-in only) ─────────────────────────────────
  const { data: firestoreIds = [] } = useQuery({
    queryKey: ['saves', uid],
    queryFn: () => fetchSavedIds(uid!),
    enabled: Boolean(uid && isSignedIn),
    staleTime: 60_000,
  });

  // ── Optimistic save ───────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: (listingId: string) => {
      if (!uid) return Promise.reject(new Error('Not signed in'));
      return saveListing(uid, listingId);
    },
    onMutate: async (listingId) => {
      await qc.cancelQueries({ queryKey: ['saves', uid] });
      const prev = qc.getQueryData<string[]>(['saves', uid]) ?? [];
      qc.setQueryData<string[]>(['saves', uid], [...prev, listingId]);
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx) qc.setQueryData<string[]>(['saves', uid], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['saves', uid] }),
  });

  // ── Optimistic unsave ─────────────────────────────────────────────────
  const unsaveMutation = useMutation({
    mutationFn: (listingId: string) => {
      if (!uid) return Promise.reject(new Error('Not signed in'));
      return unsaveListing(uid, listingId);
    },
    onMutate: async (listingId) => {
      await qc.cancelQueries({ queryKey: ['saves', uid] });
      const prev = qc.getQueryData<string[]>(['saves', uid]) ?? [];
      qc.setQueryData<string[]>(['saves', uid], prev.filter((id) => id !== listingId));
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx) qc.setQueryData<string[]>(['saves', uid], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['saves', uid] }),
  });

  // ── Derived state ─────────────────────────────────────────────────────
  const savedIds = isSignedIn ? firestoreIds : localIds;

  function isSaved(listingId: string): boolean {
    return savedIds.includes(listingId);
  }

  function toggle(listingId: string) {
    if (!isSignedIn) {
      localToggle(listingId);
      return;
    }
    if (isSaved(listingId)) {
      unsaveMutation.mutate(listingId);
    } else {
      saveMutation.mutate(listingId);
    }
  }

  return { savedIds, isSaved, toggle };
}
