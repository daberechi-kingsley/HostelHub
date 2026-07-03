/**
 * Full-screen modal that renders a side-by-side comparison of 2–4 listings.
 * Rows: Photo, Price, Type, Zone, Distance, Rating, Amenities.
 *
 * Horizontally scrollable on narrow screens so every column is readable.
 */
import { X, Check, Minus, Star, MapPin } from 'lucide-react';
import { useCompareStore } from '@/stores/compareStore';
import { useListingsByIds } from '@/features/listings/hooks';
import { formatFcfa } from '@/lib/format/money';
import { formatDistance } from '@/lib/format/distance';
import { AMENITY_LABEL, LISTING_TYPE_LABEL } from '@/config/constants';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import type { Listing } from '@/types/listing';

// ── Row helpers ───────────────────────────────────────────────────────────
function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-28 shrink-0 py-3 pr-4 text-xs font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-44 shrink-0 border-l border-border py-3 pl-4 pr-2 text-sm">
      {children}
    </div>
  );
}

function Row({
  label,
  listings,
  render,
}: {
  label: string;
  listings: Listing[];
  render: (l: Listing) => React.ReactNode;
}) {
  return (
    <div className="flex border-b border-border">
      <RowLabel>{label}</RowLabel>
      {listings.map((l) => (
        <Cell key={l.id}>{render(l)}</Cell>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function CompareDrawer() {
  const ids = useCompareStore((s) => s.ids);
  const drawerOpen = useCompareStore((s) => s.drawerOpen);
  const closeDrawer = useCompareStore((s) => s.closeDrawer);
  const remove = useCompareStore((s) => s.remove);

  const { data: listings = [], isLoading } = useListingsByIds(ids);

  if (!drawerOpen) return null;

  // Build the union of amenities across all compared listings
  const allAmenities = Array.from(new Set(listings.flatMap((l) => l.amenities)));

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm"
      onClick={closeDrawer}
      role="dialog"
      aria-modal="true"
      aria-label="Compare listings"
    >
      {/* Panel — stop click from bubbling to backdrop */}
      <div
        className="relative mt-auto flex max-h-[90vh] flex-col overflow-hidden rounded-t-2xl bg-bg sm:mx-auto sm:my-auto sm:max-h-[80vh] sm:w-full sm:max-w-4xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-heading text-lg font-bold">
            Compare listings ({listings.length})
          </h2>
          <button
            type="button"
            aria-label="Close compare"
            onClick={closeDrawer}
            className="rounded-full p-1.5 text-text-muted hover:bg-bg-hover hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable table */}
        <div className="overflow-auto">
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-sm text-text-muted">
              Loading…
            </div>
          ) : (
            <div className="min-w-max px-5 pb-6">
              {/* Photo + title header row */}
              <div className="flex pb-4 pt-5">
                <div className="w-28 shrink-0" />
                {listings.map((l) => (
                  <div key={l.id} className="w-44 shrink-0 border-l border-border pl-4 pr-2">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                      <img
                        src={l.photos[0]}
                        alt={l.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="mt-2 flex items-start justify-between gap-1">
                      <p className="line-clamp-2 text-xs font-semibold leading-tight text-text">
                        {l.title}
                      </p>
                      {/* Remove from compare */}
                      <button
                        type="button"
                        aria-label={`Remove ${l.title} from compare`}
                        onClick={() => remove(l.id)}
                        className="mt-0.5 shrink-0 rounded-full p-0.5 text-text-subtle hover:bg-bg-hover hover:text-text"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {l.verified && (
                      <div className="mt-1">
                        <VerifiedBadge />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              <Row
                label="Price / year"
                listings={listings}
                render={(l) => (
                  <span className="font-heading font-bold text-text">
                    {formatFcfa(l.pricePerYear)}
                  </span>
                )}
              />
              <Row
                label="Type"
                listings={listings}
                render={(l) => LISTING_TYPE_LABEL[l.type]}
              />
              <Row
                label="Zone"
                listings={listings}
                render={(l) => (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    {l.zone}
                  </span>
                )}
              />
              <Row
                label="Distance"
                listings={listings}
                render={(l) => `${formatDistance(l.distanceFromUbMeters)} to UB`}
              />
              <Row
                label="Rating"
                listings={listings}
                render={(l) => (
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" strokeWidth={1.5} />
                    {l.rating.toFixed(1)}
                    <span className="text-text-muted">({l.reviewCount})</span>
                  </span>
                )}
              />

              {/* Amenity rows — one per amenity present in any listing */}
              {allAmenities.length > 0 && (
                <>
                  <div className="flex border-b border-border bg-bg-card">
                    <div className="w-28 shrink-0 py-2 pr-4 text-2xs font-bold uppercase tracking-widest text-text-subtle">
                      Amenities
                    </div>
                    {listings.map((l) => (
                      <div key={l.id} className="w-44 shrink-0 border-l border-border py-2 pl-4" />
                    ))}
                  </div>
                  {allAmenities.map((amenity) => (
                    <div key={amenity} className="flex border-b border-border">
                      <RowLabel>{AMENITY_LABEL[amenity]}</RowLabel>
                      {listings.map((l) => (
                        <Cell key={l.id}>
                          {l.amenities.includes(amenity) ? (
                            <Check className="h-4 w-4 text-verified" />
                          ) : (
                            <Minus className="h-4 w-4 text-text-subtle" />
                          )}
                        </Cell>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
