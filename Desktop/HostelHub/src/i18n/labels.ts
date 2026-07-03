/**
 * Locale-aware labels for listing types + amenities.
 *
 * The raw enum values (constants.ts) map to `type.*` / `amenity.*` keys in the
 * translation dictionary. Use these hooks anywhere a type or amenity is shown
 * so it follows the language toggle.
 */
import { useT } from './useT';
import type { TranslationKey } from './translations';
import type { ListingType, Amenity } from '@/config/constants';

export function useTypeLabel() {
  const t = useT();
  return (type: ListingType): string => t(`type.${type}` as TranslationKey);
}

export function useAmenityLabel() {
  const t = useT();
  return (amenity: Amenity): string => t(`amenity.${amenity}` as TranslationKey);
}
