/**
 * React Query hook that calls the `aiSearch` Cloud Function and returns
 * ranked listing IDs. Only fires when there is a non-empty query string.
 *
 * The function is called at most once per unique query (5-minute stale window)
 * — repeat searches return instantly from cache.
 *
 * Error handling strategy:
 *   • If the function throws (no API key, network error, cold start timeout),
 *     `isError` becomes true and SearchPage falls back to client-side filtering.
 *   • If the function returns `degraded: true` (API key not set), we treat it
 *     as a graceful miss — same fallback applies.
 */
import { useQuery } from '@tanstack/react-query';
import { callAiSearch, type AiSearchResponse } from '@/lib/api/functions';

export function useAiSearch(query: string) {
  const trimmed = query.trim();

  return useQuery<AiSearchResponse>({
    queryKey: ['aiSearch', trimmed],
    queryFn: () => callAiSearch({ query: trimmed }),
    enabled: trimmed.length > 0,
    staleTime: 5 * 60_000,   // 5 minutes — same query = cached result
    retry: false,            // don't retry Claude failures; fall back to client-side
    gcTime: 10 * 60_000,     // keep in memory 10 min after last consumer unmounts
  });
}
