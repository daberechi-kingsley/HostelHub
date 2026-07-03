/**
 * Shared search-filter types, options, and helpers.
 * Used by FilterSheet (the UI) and SearchPage (the result pipeline).
 */
import type { Amenity } from '@/config/constants';

export interface PriceRange {
  min: number;
  max: number;
  label: string;
}

export interface SearchFilters {
  zones: Set<string>;
  types: Set<string>;
  priceRange: PriceRange | null;
  maxDistanceMeters: number | null;
  amenities: Set<Amenity>;
}

export const EMPTY_FILTERS: SearchFilters = {
  zones: new Set(),
  types: new Set(),
  priceRange: null,
  maxDistanceMeters: null,
  amenities: new Set(),
};

/** Distance-from-UB options, in metres. */
export const DISTANCE_OPTIONS = [
  { label: '< 500 m', meters: 500 },
  { label: '< 1 km', meters: 1_000 },
  { label: '< 2 km', meters: 2_000 },
  { label: '< 3 km', meters: 3_000 },
] as const;

/** Immutable toggle: returns a new Set with `value` added or removed. */
export function toggleSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

/** Number of active filter dimensions — drives the badge + "Clear N". */
export function countActiveFilters(f: SearchFilters): number {
  return (
    f.types.size +
    f.zones.size +
    (f.priceRange ? 1 : 0) +
    (f.maxDistanceMeters !== null ? 1 : 0) +
    f.amenities.size
  );
}
