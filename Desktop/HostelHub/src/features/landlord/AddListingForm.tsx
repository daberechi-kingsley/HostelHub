/**
 * Add / Edit listing form.
 *
 * Shared by both create and edit flows:
 *   • No initialListing → create mode (starts blank, status='draft')
 *   • initialListing provided → edit mode (pre-filled, only allowed for status='draft')
 *
 * Photo upload:
 *   • New files are uploaded to Storage on submit, before the Firestore write.
 *   • Existing URLs (from an edit) are kept as-is.
 *   • Up to MAX_PHOTOS photos total.
 *
 * Geo:
 *   • Auto-computed from the selected zone using zone-centre coordinates +
 *     a tiny random jitter so pins don't stack on the map.
 *   • Good enough for MVP; a map picker can replace this in a later chunk.
 */
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, X, Loader2, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import Button from '@/components/ui/Button';
import { useUser } from '@/hooks/useUser';
import { uploadListingPhoto, type ListingFormData } from './api';
import { useCreateListing, useUpdateListing } from './hooks';
import {
  BUEA_ZONES,
  LISTING_TYPES,
  LISTING_TYPE_LABEL,
  AMENITIES,
  AMENITY_LABEL,
  type BueaZone,
  type ListingType,
  type Amenity,
} from '@/config/constants';
import type { Listing } from '@/types/listing';

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB — matches storage.rules

interface Props {
  /** When provided, the form pre-fills for editing. */
  initialListing?: Listing;
  onSuccess: (listingId: string) => void;
  onCancel: () => void;
}

export default function AddListingForm({ initialListing, onSuccess, onCancel }: Props) {
  const isEdit = Boolean(initialListing);
  const { firebaseUser } = useUser();

  // ── Form state ────────────────────────────────────────────────────────────
  const [type,        setType]        = useState<ListingType>(initialListing?.type ?? 'single');
  const [title,       setTitle]       = useState(initialListing?.title ?? '');
  const [description, setDescription] = useState(initialListing?.description ?? '');
  const [price,       setPrice]       = useState(
    initialListing ? String(initialListing.pricePerYear) : '',
  );
  const [zone,        setZone]        = useState<BueaZone>(initialListing?.zone ?? 'Molyko');
  const [address,     setAddress]     = useState(initialListing?.address ?? '');
  const [amenities,   setAmenities]   = useState<Set<Amenity>>(
    new Set(initialListing?.amenities ?? []),
  );

  // Existing photo URLs (edit mode) + new File objects selected by the user
  const [existingUrls, setExistingUrls] = useState<string[]>(initialListing?.photos ?? []);
  const [newFiles,     setNewFiles]     = useState<File[]>([]);
  const [previews,     setPreviews]     = useState<string[]>([]);

  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useCreateListing();
  const updateMutation = useUpdateListing();
  const isBusy = createMutation.isPending || updateMutation.isPending || uploading;

  // Revoke blob URLs on unmount to avoid memory leaks
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  function toggleAmenity(a: Amenity) {
    setAmenities((prev) => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const total = existingUrls.length + newFiles.length + files.length;

    if (total > MAX_PHOTOS) {
      setError(`You can add up to ${MAX_PHOTOS} photos total.`);
      return;
    }

    const oversized = files.find((f) => f.size > MAX_PHOTO_BYTES);
    if (oversized) {
      setError(`"${oversized.name}" exceeds 8 MB. Please compress it first.`);
      return;
    }

    setError(null);
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setNewFiles((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...newPreviews]);

    // Reset so the same file can be re-selected if removed
    e.target.value = '';
  }

  function removeExisting(index: number) {
    setExistingUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNew(index: number) {
    URL.revokeObjectURL(previews[index]!);
    setNewFiles((prev)   => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim())          { setError('Title is required.');              return; }
    if (!address.trim())        { setError('Address is required.');            return; }
    const priceNum = Number(price.replace(/[^0-9]/g, ''));
    if (!priceNum || priceNum < 10_000) {
      setError('Enter a valid annual price (minimum 10,000 FCFA).');
      return;
    }
    const totalPhotos = existingUrls.length + newFiles.length;
    if (totalPhotos === 0)      { setError('Add at least one photo.');         return; }

    if (!firebaseUser) { setError('You must be signed in.'); return; }

    try {
      // 1. Upload any new photos
      setUploading(true);
      const uploadedUrls = await Promise.all(
        newFiles.map((f) => uploadListingPhoto(firebaseUser.uid, f)),
      );
      setUploading(false);

      const finalPhotos = [...existingUrls, ...uploadedUrls];

      const formData: ListingFormData = {
        type,
        title: title.trim(),
        description: description.trim(),
        pricePerYear: priceNum,
        zone,
        address: address.trim(),
        amenities: [...amenities],
        photos: finalPhotos,
      };

      // 2. Create or update Firestore doc
      if (isEdit && initialListing) {
        await updateMutation.mutateAsync({ id: initialListing.id, data: formData });
        onSuccess(initialListing.id);
      } else {
        const id = await createMutation.mutateAsync(formData);
        onSuccess(id);
      }
    } catch (err) {
      setUploading(false);
      setError('Something went wrong. Check your connection and try again.');
      console.error('[AddListingForm]', err);
    }
  }

  const totalPhotos = existingUrls.length + newFiles.length;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
      aria-label={isEdit ? 'Edit listing' : 'New listing'}
    >
      {/* ── 1. Property type ─────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-text-muted">
          Property type
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LISTING_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={clsx(
                'rounded-xl border px-4 py-3 text-sm font-semibold transition',
                type === t
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-bg-card text-text hover:bg-bg-hover',
              )}
              aria-pressed={type === t}
            >
              {LISTING_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </section>

      {/* ── 2. Basic info ─────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h3 className="font-heading text-sm font-bold uppercase tracking-wide text-text-muted">
          Basic information
        </h3>

        {/* Title */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="listing-title">
            Listing title <span className="text-accent-700">*</span>
          </label>
          <input
            id="listing-title"
            type="text"
            required
            maxLength={80}
            placeholder='e.g. "Quiet single room near UB gate"'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-right text-xs text-text-muted">{title.length}/80</p>
        </div>

        {/* Zone + Address side by side on sm+ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="listing-zone">
              Zone <span className="text-accent-700">*</span>
            </label>
            <select
              id="listing-zone"
              value={zone}
              onChange={(e) => setZone(e.target.value as BueaZone)}
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
            >
              {BUEA_ZONES.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="listing-address">
              Street / landmark <span className="text-accent-700">*</span>
            </label>
            <input
              id="listing-address"
              type="text"
              required
              placeholder='e.g. "Off Checkpoint, Molyko"'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Price */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="listing-price">
            Price per year (FCFA) <span className="text-accent-700">*</span>
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-bg px-4 py-3 focus-within:border-primary">
            <input
              id="listing-price"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 250000"
              value={price}
              onChange={(e) => {
                // Allow only digits
                const raw = e.target.value.replace(/[^0-9]/g, '');
                setPrice(raw);
              }}
              className="w-full bg-transparent text-sm outline-none"
            />
            <span className="shrink-0 text-sm text-text-muted">FCFA / year</span>
          </div>
          {price && Number(price) > 0 && (
            <p className="mt-1 text-xs text-text-muted">
              ≈ {Math.round(Number(price) / 12).toLocaleString()} FCFA/month · Booking fee: {Math.round(Number(price) * 0.1).toLocaleString()} FCFA
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="mb-1.5 block text-sm font-medium" htmlFor="listing-desc">
            Description
          </label>
          <textarea
            id="listing-desc"
            rows={4}
            maxLength={600}
            placeholder="Describe the room — what's included, rules, how to get there…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full resize-none rounded-xl border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-primary"
          />
          <p className="mt-1 text-right text-xs text-text-muted">{description.length}/600</p>
        </div>
      </section>

      {/* ── 3. Amenities ──────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-text-muted">
          Amenities
        </h3>
        <div className="flex flex-wrap gap-2">
          {AMENITIES.map((a) => {
            const active = amenities.has(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={clsx(
                  'chip',
                  active && 'chip-active',
                )}
                aria-pressed={active}
              >
                {AMENITY_LABEL[a]}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 4. Photos ─────────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-1 font-heading text-sm font-bold uppercase tracking-wide text-text-muted">
          Photos
        </h3>
        <p className="mb-3 text-xs text-text-muted">
          Up to {MAX_PHOTOS} photos · 8 MB each · JPEG or PNG.
          The first photo is your cover image.
        </p>

        {/* Preview grid */}
        {(existingUrls.length > 0 || newFiles.length > 0) && (
          <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {existingUrls.map((url, i) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExisting(i)}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-2xs font-medium text-white">
                    Cover
                  </span>
                )}
              </div>
            ))}
            {previews.map((url, i) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-primary/30">
                <img src={url} alt={`New photo ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNew(i)}
                  className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload zone */}
        {totalPhotos < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-sm text-text-muted transition hover:border-primary hover:text-primary"
          >
            <ImagePlus className="h-8 w-8" />
            <span>Click to add photos</span>
            <span className="text-xs">
              {totalPhotos}/{MAX_PHOTOS} added
            </span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </section>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-accent-50 px-4 py-3 text-sm text-accent-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onCancel}
          disabled={isBusy}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isBusy}
          className="flex-1"
        >
          {isBusy ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploading ? 'Uploading photos…' : 'Saving…'}
            </span>
          ) : isEdit ? (
            'Save changes'
          ) : (
            'Save as draft'
          )}
        </Button>
      </div>

      <p className="text-center text-xs text-text-muted">
        Saved as a draft. You can submit it for admin review from your dashboard.
      </p>
    </form>
  );
}
