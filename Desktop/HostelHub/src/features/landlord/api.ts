/**
 * Firestore CRUD for a landlord's / agent's own listings.
 *
 * Security model (mirrors firestore.rules):
 *   • Only the owning user can create / update / delete their listings.
 *   • Photos are compressed client-side and stored INLINE as JPEG data URLs on
 *     the listing document — no Firebase Storage bucket required (same approach
 *     as profile avatars). Each photo is squeezed under ~170 KB so that up to
 *     MAX_PHOTOS of them stay comfortably inside Firestore's 1 MB doc cap.
 *   • Listings start as 'draft'. Owners submit for review → 'pending'.
 *     Admin approves → 'active'.
 *   • Only 'draft' listings can be deleted by the owner.
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { distanceFromUb } from '@/lib/geo/distance';
import type { BueaZone, ListingType, Amenity } from '@/config/constants';
import type { Listing, GeoPoint } from '@/types/listing';

// ── Zone centre coordinates (approximate) ────────────────────────────────────
// Used to auto-populate geo when a landlord creates a listing.
// Small ±0.001° jitter is added so pins don't stack on the map.
const ZONE_CENTRES: Record<BueaZone, GeoPoint> = {
  Molyko:       { lat: 4.1580, lng: 9.2840 },
  Bonduma:      { lat: 4.1500, lng: 9.2730 },
  'Mile 16':    { lat: 4.1390, lng: 9.2650 },
  'Mile 17':    { lat: 4.1350, lng: 9.2600 },
  'Mile 18':    { lat: 4.1300, lng: 9.2550 },
  Bomaka:       { lat: 4.1440, lng: 9.2700 },
  Sandpit:      { lat: 4.1530, lng: 9.2900 },
  'Great Soppo':{ lat: 4.1620, lng: 9.2940 },
  Bokwango:     { lat: 4.1700, lng: 9.2710 },
  'Buea Town':  { lat: 4.1650, lng: 9.2450 },
};

function jitter(): number {
  return (Math.random() - 0.5) * 0.002; // ±~111m
}

export function geoForZone(zone: BueaZone): GeoPoint {
  const c = ZONE_CENTRES[zone];
  return { lat: +(c.lat + jitter()).toFixed(6), lng: +(c.lng + jitter()).toFixed(6) };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ListingFormData {
  type: ListingType;
  title: string;
  description: string;
  pricePerYear: number;
  zone: BueaZone;
  address: string;
  amenities: Amenity[];
  /** Download URLs — already uploaded to Storage before this is called. */
  photos: string[];
}

// ── Photo processing ──────────────────────────────────────────────────────────
// Photos are compressed to inline JPEG data URLs — no Firebase Storage needed.

/** Reject source files larger than this before we even try to compress. */
const MAX_SOURCE_BYTES = 10 * 1024 * 1024; // 10 MB
/** Longest edge of the stored image, in pixels (good for cards + detail view). */
const MAX_DIMENSION = 1000;
/** Target ceiling per encoded photo so 5 fit inside Firestore's 1 MB doc cap. */
const MAX_ENCODED_BYTES = 170_000;

/** A user-facing error — its message is safe to show directly in the UI. */
export class ListingPhotoError extends Error {}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ListingPhotoError('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ListingPhotoError('That image could not be opened.'));
    img.src = src;
  });
}

/**
 * Downscale to MAX_DIMENSION on the longest edge and encode as JPEG, stepping
 * the quality down until the result is under MAX_ENCODED_BYTES. Returns a data
 * URL that renders anywhere via <img src> and lives inline on the listing doc.
 */
async function compressToDataUrl(file: File): Promise<string> {
  const src = await readAsDataUrl(file);
  const img = await loadImage(src);

  const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ListingPhotoError('Your browser could not process the image.');
  ctx.drawImage(img, 0, 0, w, h);

  // Step quality down until we fit the byte ceiling (or hit the floor).
  for (const quality of [0.8, 0.7, 0.6, 0.5, 0.4]) {
    const out = canvas.toDataURL('image/jpeg', quality);
    if (out.length <= MAX_ENCODED_BYTES || quality === 0.4) return out;
  }
  // Unreachable, but keeps TypeScript happy.
  return canvas.toDataURL('image/jpeg', 0.4);
}

/**
 * Validate + compress one listing photo, returning an inline JPEG data URL.
 * Throws ListingPhotoError (user-friendly message) on any problem so the UI
 * shows a clear error instead of hanging.
 *
 * `uid` is kept in the signature for call-site compatibility (previously the
 * Storage path prefix); it's unused now that photos are stored inline.
 */
export async function uploadListingPhoto(_uid: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ListingPhotoError('Please choose an image file (JPG, PNG, or WebP).');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ListingPhotoError('Image is too large. Please pick one under 10 MB.');
  }
  return compressToDataUrl(file);
}

// ── Listing CRUD ──────────────────────────────────────────────────────────────

/**
 * Create a new listing doc with status='draft'.
 * Returns the new Firestore document ID.
 */
export async function createListing(
  uid: string,
  ownerRole: 'landlord' | 'agent',
  data: ListingFormData,
): Promise<string> {
  const geo = geoForZone(data.zone);
  const now = Date.now();
  const docRef = await addDoc(collection(getFirebaseDb(), 'listings'), {
    ownerId: uid,
    ownerRole,
    type: data.type,
    title: data.title,
    description: data.description,
    pricePerYear: data.pricePerYear,
    zone: data.zone,
    address: data.address,
    geo,
    distanceFromUbMeters: Math.round(distanceFromUb(geo)),
    amenities: data.amenities,
    photos: data.photos,
    status: 'draft',
    verified: false,
    rating: 0,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

/**
 * Update editable fields of an existing listing.
 * Does NOT touch status, verified, ownerId — those have separate paths.
 */
export async function updateListing(
  listingId: string,
  data: ListingFormData,
): Promise<void> {
  const geo = geoForZone(data.zone);
  await updateDoc(doc(getFirebaseDb(), 'listings', listingId), {
    type: data.type,
    title: data.title,
    description: data.description,
    pricePerYear: data.pricePerYear,
    zone: data.zone,
    address: data.address,
    geo,
    distanceFromUbMeters: Math.round(distanceFromUb(geo)),
    amenities: data.amenities,
    photos: data.photos,
    updatedAt: Date.now(),
  });
}

/**
 * Move a draft listing to 'pending' so admin can review it.
 * Only callable when status === 'draft'.
 */
export async function submitListingForReview(listingId: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'listings', listingId), {
    status: 'pending',
    updatedAt: Date.now(),
  });
}

/**
 * Delete one of the owner's listings, any status (firestore.rules permits the
 * owner to delete their own listing regardless of status).
 */
export async function deleteListing(listingId: string): Promise<void> {
  await deleteDoc(doc(getFirebaseDb(), 'listings', listingId));
}

/**
 * All listings owned by uid — any status — sorted newest first.
 * No composite index needed: single where() + client-side sort.
 */
export async function fetchMyListings(uid: string): Promise<Listing[]> {
  const q = query(collection(getFirebaseDb(), 'listings'), where('ownerId', '==', uid));
  const snap = await getDocs(q);
  const results = snap.docs.map(
    (d) => ({ id: d.id, ...(d.data() as Omit<Listing, 'id'>) }),
  );
  return results.sort((a, b) => b.createdAt - a.createdAt);
}
