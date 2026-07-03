/**
 * Firestore layer for landlord/agent verification.
 *
 * Flow:
 *   1. uploadVerificationDoc — compresses/encodes a file to an inline data URL
 *   2. submitVerificationRequest — creates verificationRequests/{auto-id}
 *   3. fetchMyVerificationRequest — reads the applicant's latest request
 *
 * Storage model: documents are stored INLINE as data URLs on the
 * verificationRequests doc — no Firebase Storage bucket required (same approach
 * as listing photos + avatars). Both docs share one Firestore doc, so images
 * are compressed and non-image files (PDFs) are capped tightly to stay under
 * Firestore's 1 MB doc limit. Only the admin + owner can read the doc, so the
 * files stay private.
 */
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { VerificationRequest } from '@/types/verification';

export type VerificationDocKind = 'id' | 'property';

/** Max ORIGINAL file size we accept before processing. */
export const MAX_DOC_BYTES = 10 * 1024 * 1024;
/** Longest edge for image docs, in pixels — keeps text on IDs legible. */
const MAX_IMAGE_DIMENSION = 1400;
/** Ceiling per encoded IMAGE doc (two share one 1 MB Firestore doc). */
const MAX_IMAGE_ENCODED_BYTES = 300_000;
/**
 * Non-image files (PDFs) can't be recompressed in-browser, so they're stored
 * raw as base64. Cap the ORIGINAL tightly: base64 inflates ~33%, and two docs
 * share one 1 MB Firestore doc.
 */
const MAX_NONIMAGE_SOURCE_BYTES = 450 * 1024;

/** A user-facing error — its message is safe to show directly in the UI. */
export class VerificationDocError extends Error {}

function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new VerificationDocError('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new VerificationDocError('That image could not be opened.'));
    img.src = src;
  });
}

/** Downscale + JPEG-encode an image doc, stepping quality down to fit the cap. */
async function compressImage(file: File): Promise<string> {
  const src = await readAsDataUrl(file);
  const img = await loadImage(src);

  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new VerificationDocError('Your browser could not process the image.');
  ctx.drawImage(img, 0, 0, w, h);

  for (const quality of [0.8, 0.7, 0.6, 0.5, 0.4]) {
    const out = canvas.toDataURL('image/jpeg', quality);
    if (out.length <= MAX_IMAGE_ENCODED_BYTES || quality === 0.4) return out;
  }
  return canvas.toDataURL('image/jpeg', 0.4);
}

/**
 * Validate + encode one verification document, returning an inline data URL.
 * Images are compressed; PDFs/other files are stored raw under a strict cap.
 * Throws VerificationDocError (user-friendly message) so the UI shows a clear
 * error instead of hanging.
 *
 * `uid` / `kind` are kept for call-site compatibility (previously the Storage
 * path); they're unused now that documents are stored inline.
 */
export async function uploadVerificationDoc(
  _uid: string,
  _kind: VerificationDocKind,
  file: File,
): Promise<string> {
  if (file.size > MAX_DOC_BYTES) {
    throw new VerificationDocError(`"${file.name}" is too large. Please keep it under 10 MB.`);
  }

  if (file.type.startsWith('image/')) {
    return compressImage(file);
  }

  // PDF or other non-image — can't recompress, so enforce a tight size cap.
  if (file.size > MAX_NONIMAGE_SOURCE_BYTES) {
    throw new VerificationDocError(
      `"${file.name}" is too large. PDFs must be under 450 KB — compress it, or upload a clear photo/screenshot of the document instead.`,
    );
  }
  return readAsDataUrl(file);
}

export interface SubmitVerificationInput {
  uploaderId: string;
  displayName: string;
  role: 'landlord' | 'agent';
  idDocUrl: string;
  propertyDocUrl: string;
  note?: string;
}

/** Creates the verificationRequests doc once both files are uploaded. */
export async function submitVerificationRequest(
  input: SubmitVerificationInput,
): Promise<void> {
  await addDoc(collection(getFirebaseDb(), 'verificationRequests'), {
    uploaderId: input.uploaderId,
    displayName: input.displayName,
    role: input.role,
    idDocUrl: input.idDocUrl,
    propertyDocUrl: input.propertyDocUrl,
    note: input.note ?? '',
    status: 'pending',
    submittedAt: Date.now(),
  });
}

function toRequest(snap: QueryDocumentSnapshot): VerificationRequest {
  return { id: snap.id, ...(snap.data() as Omit<VerificationRequest, 'id'>) };
}

/** The applicant's most recent request, or null if they've never submitted one. */
export async function fetchMyVerificationRequest(
  uid: string,
): Promise<VerificationRequest | null> {
  const q = query(
    collection(getFirebaseDb(), 'verificationRequests'),
    where('uploaderId', '==', uid),
    orderBy('submittedAt', 'desc'),
    limit(1),
  );
  const snap = await getDocs(q);
  return snap.empty ? null : toRequest(snap.docs[0]!);
}
