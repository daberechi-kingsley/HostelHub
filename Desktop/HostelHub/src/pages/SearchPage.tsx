/**
 * Search page — two-mode result pipeline:
 *
 * With text query:
 *   1. Call aiSearch Cloud Function → rankedIds (Claude Haiku 4.5, ~2-4 s).
 *   2. Re-order the locally-cached listings by those IDs.
 *   3. Apply chip filters on top.
 *   4. If Cloud Function fails (no key, cold start, offline) → fall back to
 *      client-side text search, same as "no query" mode.
 *
 * Without text query:
 *   All listings, chip-filtered client-side, newest first.
 */
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import SearchBar from '@/features/search/SearchBar';
import FilterSheet from '@/features/search/FilterSheet';
import {
  type SearchFilters,
  EMPTY_FILTERS,
  countActiveFilters,
} from '@/features/search/filters';
import ListingGrid from '@/features/listings/ListingGrid';
import { useListings } from '@/features/listings/hooks';
import { useAiSearch } from '@/features/search/useAiSearch';
import { useT } from '@/i18n/useT';
import type { Listing } from '@/types/listing';

/**
 * Default result order: highest-rated first.
 *   - Unrated listings (rating 0 / null / undefined) always sink to the bottom.
 *   - Equal ratings: verified listings rank above unverified ones.
 *   - Equal rating + verification: newest first (stable, deterministic).
 * Only applied to the base "no active search" order — AI ranking (when the
 * student types a query) still takes priority, same as before.
 */
function byTopRated(a: Listing, b: Listing): number {
  const ratingOf = (l: Listing) => (typeof l.rating === 'number' && l.rating > 0 ? l.rating : -1);
  const ra = ratingOf(a);
  const rb = ratingOf(b);
  if (ra !== rb) return rb - ra;

  const va = a.verified ? 1 : 0;
  const vb = b.verified ? 1 : 0;
  if (va !== vb) return vb - va;

  return b.createdAt - a.createdAt;
}

export default function SearchPage() {
  const t = useT();
  const [params] = useSearchParams();
  const query = params.get('q') ?? '';
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);

  const { data: allListings, isLoading: listingsLoading, isError: listingsError } = useListings();
  const {
    data: aiResult,
    isLoading: aiLoading,
    isError: aiError,
  } = useAiSearch(query);

  // ── Result pipeline ────────────────────────────────────────────────────
  const results = useMemo(() => {
    const source = allListings ?? [];
    const q = query.trim().toLowerCase();
    const isAiDegraded = aiResult?.degraded === true;

    // Re-order by AI ranking when we have a successful, non-degraded response;
    // otherwise the default order is highest-rated first (see byTopRated).
    let ordered = [...source].sort(byTopRated);
    const hasAiRanking =
      q.length > 0 && Array.isArray(aiResult?.rankedIds) && aiResult!.rankedIds.length > 0;

    if (hasAiRanking) {
      const rankMap = new Map(aiResult!.rankedIds.map((id, i) => [id, i]));
      ordered = [...source].sort((a, b) => {
        const ra = rankMap.get(a.id) ?? source.length;
        const rb = rankMap.get(b.id) ?? source.length;
        return ra - rb;
      });
    }

    return ordered.filter((l) => {
      // Chip filters always apply (instant, client-side)
      if (filters.types.size > 0 && !filters.types.has(l.type)) return false;
      if (filters.zones.size > 0 && !filters.zones.has(l.zone)) return false;
      if (
        filters.priceRange !== null &&
        (l.pricePerYear < filters.priceRange.min || l.pricePerYear > filters.priceRange.max)
      )
        return false;
      if (filters.maxDistanceMeters !== null && l.distanceFromUbMeters > filters.maxDistanceMeters)
        return false;
      if (
        filters.amenities.size > 0 &&
        ![...filters.amenities].every((a) => l.amenities.includes(a))
      )
        return false;

      // Text fallback — only when AI didn't rank AND function didn't degrade
      // (degraded = no API key; show all listings so the user still sees results)
      if (q.length > 0 && !hasAiRanking && !isAiDegraded) {
        // Word-by-word match: listing must contain at least one search word (>2 chars)
        const words = q.split(/\s+/).filter((w) => w.length > 2);
        const haystack = `${l.title} ${l.description} ${l.zone}`.toLowerCase();
        if (words.length > 0 && !words.some((w) => haystack.includes(w))) return false;
      }

      return true;
    });
  }, [filters, query, allListings, aiResult, aiError]);

  // Show grid in loading state while AI ranks results
  const isLoading = listingsLoading || (query.trim().length > 0 && aiLoading && !aiError);

  // Count active filter dimensions for "Clear N filters" button
  const activeFilterCount = countActiveFilters(filters);

  return (
    <div className="px-4 pb-12 pt-4 sm:px-6 sm:pt-6">
      {/* Centered, constrained search bar + filter icon; results sit beneath. */}
      <div className="mx-auto flex max-w-xl items-center gap-2">
        <div className="flex-1">
          <SearchBar initialValue={query} size="compact" />
        </div>
        <FilterSheet filters={filters} onChange={setFilters} resultCount={results.length} />
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <h1 className="font-heading text-xl font-bold">
          {isLoading
            ? t('search.searching')
            : `${results.length} ${results.length === 1 ? t('search.listing') : t('search.listings')}`}
          {!isLoading && query ? ` ${t('search.matching')} "${query}"` : ''}
        </h1>

        <div className="flex items-center gap-3">
          {/* AI indicator */}
          {query.trim().length > 0 && !listingsLoading && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${
                aiError ? 'text-text-muted' : 'text-primary'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {aiLoading
                ? t('search.aiRanking')
                : aiResult?.degraded
                  ? t('search.aiUnavailable')
                  : aiError
                    ? t('search.keywordSearch')
                    : t('search.aiRanked')}
            </span>
          )}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="text-xs font-medium text-primary hover:text-primary-700"
            >
              {t('search.clearFilters')} ({activeFilterCount})
            </button>
          )}
          <p className="text-xs text-text-muted">
            {query && !aiError ? t('search.sortedRelevance') : t('search.sortedNewest')}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <ListingGrid
          listings={results}
          loading={isLoading}
          error={listingsError}
          columns={3}
          emptyTitle={t('search.emptyTitle')}
          emptyDescription={t('search.emptyDesc')}
        />
      </div>
    </div>
  );
}
