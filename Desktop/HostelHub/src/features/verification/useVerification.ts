/**
 * React Query hook for the current user's verification request.
 */
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/hooks/useUser';
import { fetchMyVerificationRequest } from './api';

export function useMyVerification() {
  const { firebaseUser } = useUser();
  const uid = firebaseUser?.uid;

  return useQuery({
    queryKey: ['verification', uid],
    queryFn: () => fetchMyVerificationRequest(uid!),
    enabled: Boolean(uid),
    staleTime: 30_000,
  });
}
