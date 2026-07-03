/**
 * Profile read/write layer.
 *
 *  • Profile photo → compressed to a small thumbnail and stored INLINE in the
 *    user's Firestore document (avatarUrl). This needs no Firebase Storage
 *    bucket, so it works even when Storage isn't enabled on the project.
 *    A 256 px JPEG is ~20–40 KB — comfortably inside Firestore's 1 MB doc cap
 *    and it renders everywhere via <img src> (navbar, dropdown, dashboard).
 *  • Name / phone / bio / avatarUrl → the user's Firestore document.
 *
 * (If we later enable Storage for CDN-backed avatars, only uploadProfilePhoto
 * needs to change — the rest of the flow stays identical.)
 */
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';

/** Max ORIGINAL file size we accept before compressing. */
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
/** Longest edge of the stored thumbnail, in pixels. */
const MAX_DIMENSION = 256;
/** Re-compress harder if the encoded data URL exceeds this (Firestore safety). */
const MAX_ENCODED_BYTES = 600_000;

/** A user-facing error — its message is safe to show directly in the UI. */
export class ProfilePhotoError extends Error {}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new ProfilePhotoError('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ProfilePhotoError('That image could not be opened.'));
    img.src = src;
  });
}

/**
 * Downscale an image to a square-ish thumbnail and return a JPEG data URL.
 * Keeps aspect ratio; only ever shrinks (never upscales).
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
  if (!ctx) throw new ProfilePhotoError('Your browser could not process the image.');
  ctx.drawImage(img, 0, 0, w, h);

  let out = canvas.toDataURL('image/jpeg', 0.82);
  if (out.length > MAX_ENCODED_BYTES) out = canvas.toDataURL('image/jpeg', 0.6);
  return out;
}

/**
 * Validate, compress, and return a data URL for the chosen photo.
 * Throws ProfilePhotoError (with a user-friendly message) on any problem —
 * so the UI shows a clear error instead of hanging.
 */
export async function uploadProfilePhoto(_uid: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new ProfilePhotoError('Please choose an image file (JPG, PNG, or WebP).');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new ProfilePhotoError('Image is too large. Please pick one under 10 MB.');
  }
  return compressToDataUrl(file);
}

export interface ProfileUpdate {
  displayName: string;
  phone: string;
  bio: string;
}

/** Persist editable profile fields to the user's Firestore document. */
export async function updateUserProfile(uid: string, fields: ProfileUpdate): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', uid), {
    displayName: fields.displayName.trim(),
    phone: fields.phone.trim() || null,
    bio: fields.bio.trim(),
  });
}

/** Persist a new avatar URL (or inline data URL) to the user's document. */
export async function updateUserAvatar(uid: string, avatarUrl: string): Promise<void> {
  await updateDoc(doc(getFirebaseDb(), 'users', uid), { avatarUrl });
}
