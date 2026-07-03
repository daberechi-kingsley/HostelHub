/**
 * Filter trigger button + slide-up sheet.
 *
 * Replaces the always-visible chip rows: all filters (type, zone, price,
 * distance, amenities) live behind one icon so the results sit directly under
 * the search bar. Selections apply live; the footer just closes the sheet.
 */
import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { clsx } from 'clsx';
import {
  BUEA_ZONES,
  LISTING_TYPES,
  PRICE_BRACKETS,
  AMENITIES,
  type Amenity,
} from '@/config/constants';
import Button from '@/components/ui/Button';
import { useT } from '@/i18n/useT';
import { useTypeLabel, useAmenityLabel } from '@/i18n/labels';
import {
  DISTANCE_OPTIONS,
  toggleSet,
  countActiveFilters,
  EMPTY_FILTERS,
  type SearchFilters,
} from './filters';

interface Props {
  filters: SearchFilters;
  onChange: (next: SearchFilters) => void;
  /** Live result count, shown on the footer button. */
  resultCount: number;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx('chip', active && 'chip-active')}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-subtle">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function FilterSheet({ filters, onChange, resultCount }: Props) {
  const t = useT();
  const typeLabel = useTypeLabel();
  const amenityLabel = useAmenityLabel();
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  // Lock body scroll while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('filters.label')}
        className={clsx(
          'flex h-12 shrink-0 items-center gap-2 rounded-full border px-4 transition-colors',
          activeCount > 0
            ? 'border-primary text-primary'
            : 'border-border text-text hover:bg-bg-hover',
          'bg-bg-card',
        )}
      >
        <SlidersHorizontal className="h-5 w-5" />
        <span className="text-sm font-medium">{t('filters.label')}</span>
        {activeCount > 0 && (
          <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-primary px-1 text-2xs font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Sheet */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-bg-card shadow-xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-heading text-lg font-bold">{t('filters.title')}</h2>
              <div className="flex items-center gap-3">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange(EMPTY_FILTERS)}
                    className="text-sm font-medium text-primary hover:text-primary-700"
                  >
                    {t('filters.clearAll')}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-text-muted hover:bg-bg-hover"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-5 overflow-y-auto px-5 py-5">
              <Section label={t('filters.type')}>
                {LISTING_TYPES.map((lt) => (
                  <Chip
                    key={lt}
                    active={filters.types.has(lt)}
                    onClick={() => onChange({ ...filters, types: toggleSet(filters.types, lt) })}
                  >
                    {typeLabel(lt)}
                  </Chip>
                ))}
              </Section>

              <Section label={t('filters.zone')}>
                {BUEA_ZONES.map((z) => (
                  <Chip
                    key={z}
                    active={filters.zones.has(z)}
                    onClick={() => onChange({ ...filters, zones: toggleSet(filters.zones, z) })}
                  >
                    {z}
                  </Chip>
                ))}
              </Section>

              <Section label={t('filters.price')}>
                {PRICE_BRACKETS.map((b) => {
                  const active =
                    filters.priceRange !== null &&
                    filters.priceRange.min === b.min &&
                    filters.priceRange.max === b.max;
                  return (
                    <Chip
                      key={b.label}
                      active={active}
                      onClick={() =>
                        onChange({
                          ...filters,
                          priceRange: active ? null : { min: b.min, max: b.max, label: b.label },
                        })
                      }
                    >
                      {b.label}
                    </Chip>
                  );
                })}
              </Section>

              <Section label={t('filters.distance')}>
                {DISTANCE_OPTIONS.map((d) => {
                  const active = filters.maxDistanceMeters === d.meters;
                  return (
                    <Chip
                      key={d.label}
                      active={active}
                      onClick={() =>
                        onChange({ ...filters, maxDistanceMeters: active ? null : d.meters })
                      }
                    >
                      {d.label}
                    </Chip>
                  );
                })}
              </Section>

              <Section label={t('filters.amenities')}>
                {AMENITIES.map((a) => (
                  <Chip
                    key={a}
                    active={filters.amenities.has(a)}
                    onClick={() =>
                      onChange({ ...filters, amenities: toggleSet(filters.amenities, a as Amenity) })
                    }
                  >
                    {amenityLabel(a)}
                  </Chip>
                ))}
              </Section>
            </div>

            {/* Footer */}
            <div className="border-t border-border p-4">
              <Button variant="primary" fullWidth size="lg" onClick={() => setOpen(false)}>
                {t('filters.apply')} ({resultCount})
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
