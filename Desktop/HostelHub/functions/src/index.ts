/**
 * Cloud Functions entrypoint for Buea HostelHub.
 *
 * Locked models (see plan §7):
 *   aiSearch / aiRank   → claude-haiku-4-5-20251001   (cheap, fast, < 4 s)
 *   aiRoommateMatch     → claude-sonnet-4-6            (richer reasoning)
 *
 * All Anthropic API calls happen here — never on the client.
 */
import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onValueCreated } from 'firebase-functions/v2/database';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { getMessaging } from 'firebase-admin/messaging';
import Anthropic from '@anthropic-ai/sdk';

initializeApp();

setGlobalOptions({
  region: 'europe-west1',
  maxInstances: 10,
});

// ── Types shared between functions ───────────────────────────────────────
interface ListingSummary {
  id: string;
  title: string;
  type: string;
  zone: string;
  pricePerYear: number;
  distanceFromUbMeters: number;
  amenities: string[];
  rating: number;
  verified: boolean;
}

// ── Helper: load active listings from Firestore ──────────────────────────
async function fetchActiveListings(): Promise<ListingSummary[]> {
  const snap = await getFirestore()
    .collection('listings')
    .where('status', '==', 'active')
    .get();

  return snap.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      title: d.title ?? '',
      type: d.type ?? '',
      zone: d.zone ?? '',
      pricePerYear: d.pricePerYear ?? 0,
      distanceFromUbMeters: d.distanceFromUbMeters ?? 9999,
      amenities: d.amenities ?? [],
      rating: d.rating ?? 0,
      verified: d.verified ?? false,
    };
  });
}

// ── Helper: parse Claude's JSON response safely ──────────────────────────
function parseRankedIds(raw: string, allIds: string[]): string[] {
  try {
    const clean = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed: unknown = JSON.parse(clean);
    if (!Array.isArray(parsed)) throw new Error('not an array');

    const valid = new Set(allIds);
    const ranked = (parsed as unknown[])
      .filter((x): x is string => typeof x === 'string' && valid.has(x));

    // Append any IDs Claude omitted so every listing still appears
    const returned = new Set(ranked);
    for (const id of allIds) {
      if (!returned.has(id)) ranked.push(id);
    }
    return ranked;
  } catch {
    return allIds; // fallback: original order
  }
}

// ── aiSearch ─────────────────────────────────────────────────────────────
/**
 * Natural-language listing search powered by Claude Haiku 4.5.
 *
 * Input:  { query: string }
 * Output: { rankedIds: string[], model: string }
 *
 * The client re-orders its already-fetched listings by `rankedIds`.
 */
export const aiSearch = onCall(async (req) => {
  const query = (req.data?.query ?? '').toString().trim();
  if (!query) throw new HttpsError('invalid-argument', 'query is required');

  const apiKey = process.env.ANTHROPIC_API_KEY ?? '';
  if (!apiKey) {
    // Degrade gracefully — return empty so client falls back to client-side search
    console.warn('[aiSearch] ANTHROPIC_API_KEY not set — returning empty ranking');
    return { rankedIds: [], model: 'claude-haiku-4-5-20251001', degraded: true };
  }

  const listings = await fetchActiveListings();
  if (listings.length === 0) return { rankedIds: [], model: 'claude-haiku-4-5-20251001' };

  const client = new Anthropic({ apiKey });

  // Minimal listing payload to keep token count low (~80 tokens per listing)
  const listingPayload = listings.map((l) => ({
    id: l.id,
    title: l.title,
    type: l.type,
    zone: l.zone,
    price_fcfa_per_year: l.pricePerYear,
    distance_from_ub_metres: l.distanceFromUbMeters,
    amenities: l.amenities,
    rating: l.rating,
    verified: l.verified,
  }));

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: `You are a housing search assistant for University of Buea (UB) students in Buea, Cameroon.
Rank student housing listings by relevance to the user's natural-language query.
Consider: price in FCFA/year, location zone, distance from UB in metres, amenities, listing type, and any stated preferences.
Return ONLY a JSON array of listing IDs (strings), ordered most-relevant first.
Include every listing ID. Output nothing else — no prose, no markdown.`,
    messages: [
      {
        role: 'user',
        content: `Query: "${query}"\n\nListings:\n${JSON.stringify(listingPayload)}\n\nRanked IDs:`,
      },
    ],
  });

  const text = message.content[0]?.type === 'text' ? message.content[0].text : '[]';
  const rankedIds = parseRankedIds(text, listings.map((l) => l.id));

  return { rankedIds, model: 'claude-haiku-4-5-20251001' };
});

// ── resolveChatCounterpart ───────────────────────────────────────────────
/**
 * Returns the uid to open a chat with for a given listing.
 * Reads config/global.chatMode:
 *   'concierge' → returns config/global.conciergeUid (founder-run inbox)
 *   'direct'    → returns listing.ownerId
 *
 * Toggling chatMode in Firestore reroutes new chats without a code deploy.
 */
export const resolveChatCounterpart = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'must be signed in');

  const listingId = (req.data?.listingId ?? '').toString();
  if (!listingId) throw new HttpsError('invalid-argument', 'listingId required');

  const db = getFirestore();

  // Parallel fetch: listing doc + global config
  const [listingSnap, configSnap] = await Promise.all([
    db.collection('listings').doc(listingId).get(),
    db.collection('config').doc('global').get(),
  ]);

  if (!listingSnap.exists) throw new HttpsError('not-found', 'listing not found');

  const chatMode: string = configSnap.data()?.chatMode ?? 'concierge';
  const conciergeUid: string | null = configSnap.data()?.conciergeUid ?? null;
  const ownerId: string = listingSnap.data()?.ownerId ?? '';

  let counterpartUid: string | null;
  if (chatMode === 'direct') {
    counterpartUid = ownerId || null;
  } else {
    // concierge mode (default) — fall back to owner if no concierge configured
    counterpartUid = conciergeUid ?? ownerId ?? null;
  }

  return { counterpartUid, mode: chatMode };
});

// ── Booking flow ─────────────────────────────────────────────────────────
//
// Money state is server-trusted: bookings are written ONLY here (Admin SDK
// bypasses rules; client rules keep `allow write: if false`).
//
// PAYMENT PLACEHOLDER:
//   The MoMo / Orange Money Collections APIs are not connected yet (waiting
//   on sandbox credentials). Until then PAYMENT_SANDBOX=true and
//   `confirmBookingPayment` lets the paying student simulate the provider
//   callback. When credentials arrive:
//     1. Add `requestToPay` (MTN) / `webpayment` (OM) calls in initiateBooking.
//     2. Replace confirmBookingPayment with `momoWebhook` / `orangeWebhook`
//        HTTP endpoints that verify the provider signature.
//     3. Set PAYMENT_SANDBOX=false — the client hides the simulate button.
//   Nothing else changes: doc shape, rules, and the UI flow stay identical.

const PAYMENT_SANDBOX = true;
const BOOKING_FEE_RATE = 0.1; // 10% of annual rent — locked decision

/**
 * Creates bookings/{studentId}_{listingId} as 'pending_payment'.
 * Fee is computed server-side from the listing's current price.
 */
export const initiateBooking = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'must be signed in');

  const listingId = (req.data?.listingId ?? '').toString();
  const paymentMethod = (req.data?.paymentMethod ?? '').toString();
  const payerPhone = (req.data?.payerPhone ?? '').toString();

  if (!listingId) throw new HttpsError('invalid-argument', 'listingId required');
  if (paymentMethod !== 'mtn_momo' && paymentMethod !== 'orange_money') {
    throw new HttpsError('invalid-argument', 'invalid payment method');
  }
  if (!/^6\d{8}$/.test(payerPhone)) {
    throw new HttpsError('invalid-argument', 'invalid Cameroon mobile number');
  }

  const db = getFirestore();
  const studentId = req.auth.uid;

  const [listingSnap, studentSnap] = await Promise.all([
    db.collection('listings').doc(listingId).get(),
    db.collection('users').doc(studentId).get(),
  ]);

  if (!listingSnap.exists) throw new HttpsError('not-found', 'listing not found');
  const listing = listingSnap.data()!;

  if (listing.status !== 'active') {
    throw new HttpsError('failed-precondition', 'listing is no longer available');
  }
  if (listing.ownerId === studentId) {
    throw new HttpsError('failed-precondition', 'cannot book your own listing');
  }

  const pricePerYear: number = listing.pricePerYear ?? 0;
  const bookingFee = Math.round(pricePerYear * BOOKING_FEE_RATE);
  const bookingId = `${studentId}_${listingId}`;
  const now = Date.now();

  await db.collection('bookings').doc(bookingId).set({
    studentId,
    studentName: studentSnap.data()?.displayName ?? 'Student',
    landlordId: listing.ownerId ?? '',
    listingId,
    listingTitle: listing.title ?? '',
    pricePerYear,
    bookingFee,
    paymentMethod,
    payerPhone,
    status: 'pending_payment',
    sandbox: PAYMENT_SANDBOX,
    createdAt: now,
    paidAt: null,
    updatedAt: now,
  });

  // TODO(payment-api): call MTN requestToPay / OM webpayment here and store
  // the provider transaction reference on the booking doc.

  return { bookingId, bookingFee, sandbox: PAYMENT_SANDBOX };
});

/**
 * SANDBOX STUB for the payment provider callback.
 * Marks the booking 'paid' and flips the listing to 'reserved'.
 * Will be replaced by momoWebhook / orangeWebhook once credentials arrive.
 */
export const confirmBookingPayment = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'must be signed in');
  if (!PAYMENT_SANDBOX) {
    throw new HttpsError(
      'failed-precondition',
      'manual confirmation is disabled — payments are confirmed by the provider webhook',
    );
  }

  const bookingId = (req.data?.bookingId ?? '').toString();
  if (!bookingId) throw new HttpsError('invalid-argument', 'bookingId required');

  const db = getFirestore();
  const bookingRef = db.collection('bookings').doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) throw new HttpsError('not-found', 'booking not found');
  const booking = bookingSnap.data()!;

  if (booking.studentId !== req.auth.uid) {
    throw new HttpsError('permission-denied', 'not your booking');
  }
  if (booking.status !== 'pending_payment') {
    throw new HttpsError('failed-precondition', `booking is ${booking.status}`);
  }

  const now = Date.now();
  await Promise.all([
    bookingRef.update({ status: 'paid', paidAt: now, updatedAt: now }),
    db.collection('listings').doc(booking.listingId).update({
      status: 'reserved',
      updatedAt: now,
    }),
  ]);

  return { status: 'paid' };
});

/**
 * Student cancels a booking while it is still 'pending_payment'.
 */
export const cancelBooking = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'must be signed in');

  const bookingId = (req.data?.bookingId ?? '').toString();
  if (!bookingId) throw new HttpsError('invalid-argument', 'bookingId required');

  const db = getFirestore();
  const bookingRef = db.collection('bookings').doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) throw new HttpsError('not-found', 'booking not found');
  const booking = bookingSnap.data()!;

  if (booking.studentId !== req.auth.uid) {
    throw new HttpsError('permission-denied', 'not your booking');
  }
  if (booking.status !== 'pending_payment') {
    throw new HttpsError('failed-precondition', `booking is ${booking.status}`);
  }

  await bookingRef.update({ status: 'cancelled', updatedAt: Date.now() });
  return { status: 'cancelled' };
});

// ── onNewChatMessage ──────────────────────────────────────────────────────
/**
 * Fires whenever a message is written to chats/{chatId}/messages/{messageId}.
 *
 * Pipeline:
 *   1. Read the chat meta from RTDB to find the recipient uid.
 *   2. Load the recipient's FCM tokens from Firestore.
 *   3. Send an FCM push notification to every token.
 *   4. Auto-purge tokens that the FCM service reports as stale.
 *
 * Runs in europe-west1 so it's co-located with the RTDB and Firestore.
 */
export const onNewChatMessage = onValueCreated(
  {
    ref: 'chats/{chatId}/messages/{messageId}',
    region: 'europe-west1',
  },
  async (event) => {
    const message = event.data.val() as {
      senderId: string;
      text: string;
      ts: number;
    } | null;

    if (!message?.senderId) return;

    const { chatId } = event.params;

    // 1. Fetch chat meta from RTDB
    const metaSnap = await getDatabase()
      .ref(`chats/${chatId}/meta`)
      .get();

    if (!metaSnap.exists()) return;

    const meta = metaSnap.val() as {
      participants: Record<string, boolean>;
      listingTitle?: string;
    };

    // 2. Find the recipient (everyone in the chat who isn't the sender)
    const recipientUid = Object.keys(meta.participants).find(
      (uid) => uid !== message.senderId,
    );
    if (!recipientUid) return;

    // 3. Load FCM tokens from Firestore
    const [recipientDoc, senderDoc] = await Promise.all([
      getFirestore().collection('users').doc(recipientUid).get(),
      getFirestore().collection('users').doc(message.senderId).get(),
    ]);

    const tokens: string[] = recipientDoc.data()?.fcmTokens ?? [];
    if (tokens.length === 0) return;

    const senderName: string = senderDoc.data()?.displayName ?? 'Someone';
    const listingTitle: string = meta.listingTitle ?? 'a listing';

    // Truncate long messages for the notification body
    const bodyText =
      message.text.length > 120
        ? `${message.text.slice(0, 120)}…`
        : message.text;

    // 4. Send to all tokens; collect stale ones for cleanup
    const staleTokens: string[] = [];

    await Promise.all(
      tokens.map(async (token) => {
        try {
          await getMessaging().send({
            token,
            notification: {
              title: `${senderName} · ${listingTitle}`,
              body: bodyText,
            },
            data: { chatId },
            webpush: {
              notification: {
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-192.png',
                tag: `chat-${chatId}`,   // collapses duplicate notifications
              },
              fcmOptions: { link: `/chat/${chatId}` },
            },
          });
        } catch (err: unknown) {
          const code =
            (err as { errorInfo?: { code?: string } })?.errorInfo?.code ?? '';
          if (code === 'messaging/registration-token-not-registered') {
            staleTokens.push(token);
          }
        }
      }),
    );

    // 5. Remove stale tokens atomically
    if (staleTokens.length > 0) {
      await getFirestore()
        .collection('users')
        .doc(recipientUid)
        .update({ fcmTokens: FieldValue.arrayRemove(...staleTokens) });
    }
  },
);

// ── Helper: send FCM to a single user from Firestore ─────────────────────
async function sendToUser(
  recipientUid: string,
  title: string,
  body: string,
  link: string,
  tag: string,
): Promise<void> {
  const userSnap = await getFirestore().collection('users').doc(recipientUid).get();
  const tokens: string[] = userSnap.data()?.fcmTokens ?? [];
  if (tokens.length === 0) return;

  const staleTokens: string[] = [];
  await Promise.all(
    tokens.map(async (token) => {
      try {
        await getMessaging().send({
          token,
          notification: { title, body },
          webpush: {
            notification: {
              icon: '/icons/icon-192.png',
              badge: '/icons/icon-192.png',
              tag,
            },
            fcmOptions: { link },
          },
        });
      } catch (err: unknown) {
        const code = (err as { errorInfo?: { code?: string } })?.errorInfo?.code ?? '';
        if (code === 'messaging/registration-token-not-registered') {
          staleTokens.push(token);
        }
      }
    }),
  );

  if (staleTokens.length > 0) {
    await getFirestore()
      .collection('users')
      .doc(recipientUid)
      .update({ fcmTokens: FieldValue.arrayRemove(...staleTokens) });
  }
}

// ── onVisitRequested ─────────────────────────────────────────────────────
/**
 * Fires when a student creates a new visit request (inquiries collection).
 *
 * Notifies the landlord: "Ngoh wants to visit Studio near UB"
 */
export const onVisitRequested = onDocumentCreated(
  {
    document: 'inquiries/{inquiryId}',
    region: 'europe-west1',
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    const { landlordId, studentName, listingTitle } = data as {
      landlordId: string;
      studentName: string;
      listingTitle: string;
    };

    if (!landlordId) return;

    await sendToUser(
      landlordId,
      `New visit request — ${listingTitle}`,
      `${studentName} wants to visit your listing. Tap to confirm or decline.`,
      '/dashboard',
      `visit-requested-${event.params.inquiryId}`,
    );
  },
);

// ── onVisitStatusChanged ─────────────────────────────────────────────────
/**
 * Fires when a landlord confirms or declines a visit request.
 *
 * Notifies the student with the outcome.
 */
export const onVisitStatusChanged = onDocumentUpdated(
  {
    document: 'inquiries/{inquiryId}',
    region: 'europe-west1',
  },
  async (event) => {
    const before = event.data?.before.data() as {
      status: string;
      studentId: string;
      listingTitle: string;
      responseNote?: string;
    } | undefined;

    const after = event.data?.after.data() as typeof before;

    if (!before || !after) return;

    // Only react to actual status changes
    if (before.status === after.status) return;

    // Only notify on landlord responses (confirmed / declined)
    if (after.status !== 'confirmed' && after.status !== 'declined') return;

    const { studentId, listingTitle, responseNote } = after;
    if (!studentId) return;

    const isConfirmed = after.status === 'confirmed';
    const title = isConfirmed
      ? `Visit confirmed — ${listingTitle}`
      : `Visit declined — ${listingTitle}`;
    const body = isConfirmed
      ? `Your visit request has been confirmed!${responseNote ? ` Note: ${responseNote}` : ''}`
      : `Your visit request was declined.${responseNote ? ` Reason: ${responseNote}` : ' You can send a new request.'}`;

    await sendToUser(
      studentId,
      title,
      body,
      `/listing/${event.params.inquiryId.split('_')[1] ?? ''}`,
      `visit-status-${event.params.inquiryId}`,
    );
  },
);

// ── aiRoommateMatch ──────────────────────────────────────────────────────────
/**
 * AI Roommate Matching — Claude Sonnet 4.6 (locked model per plan §7).
 *
 * Pipeline:
 *   1. Load the caller's roommateProfile doc from Firestore.
 *   2. Load all *other* active profiles (up to 50).
 *   3. Strip PII; build a scoring prompt for Claude Sonnet 4.6.
 *   4. Parse the ranked [{uid, score, reason}] response.
 *   5. Enrich with display data (displayName, avatarUrl, safe profile fields).
 *   6. Return top 10 matches.
 *
 * Fallback (no ANTHROPIC_API_KEY): uses a deterministic JS scoring algorithm
 * that considers budget overlap, zone overlap, lifestyle, cleanliness, and
 * study habits.  degraded: true is set so the client can show a notice.
 */

interface CandidateProfile {
  uid: string;
  displayName: string;
  avatarUrl: string;
  faculty: string;
  courseYear: string;
  bio: string;
  budgetMin: number;
  budgetMax: number;
  preferredZones: string[];
  lifestyle: string;
  cleanliness: string;
  studyHabits: string;
  genderPreference: string;
  smokingOk: boolean;
  petsOk: boolean;
  lookingFor: string;
}

interface MatchResult {
  uid: string;
  displayName: string;
  avatarUrl: string;
  compatibilityScore: number;
  matchReason: string;
  profile: {
    faculty: string;
    courseYear: string;
    bio: string;
    budgetMin: number;
    budgetMax: number;
    preferredZones: string[];
    lifestyle: string;
    cleanliness: string;
    studyHabits: string;
    lookingFor: string;
  };
}

/** JS fallback scoring (0–100) when Claude is unavailable. */
function jsScore(caller: CandidateProfile, candidate: CandidateProfile): number {
  let score = 0;

  // Budget overlap — 30 pts
  const oMin = Math.max(caller.budgetMin, candidate.budgetMin);
  const oMax = Math.min(caller.budgetMax, candidate.budgetMax);
  if (oMax >= oMin) score += 30;

  // Zone overlap — up to 25 pts (10 per shared zone, max 25)
  const callerZones = new Set(caller.preferredZones);
  const overlap = candidate.preferredZones.filter((z) => callerZones.has(z)).length;
  score += Math.min(25, overlap * 10);

  // Lifestyle match — 20 pts
  if (caller.lifestyle === candidate.lifestyle) score += 20;

  // Cleanliness match — 15 pts
  if (caller.cleanliness === candidate.cleanliness) score += 15;

  // Study habits match — 10 pts
  if (caller.studyHabits === candidate.studyHabits) score += 10;

  return Math.min(100, score);
}

/** Safely parse Claude's JSON array of {uid, score, reason}. */
function parseMatchIds(raw: string): Array<{ uid: string; score: number; reason: string }> {
  try {
    const clean = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed: unknown = JSON.parse(clean);
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(
      (x): x is { uid: string; score: number; reason: string } =>
        typeof x === 'object' && x !== null &&
        typeof (x as Record<string, unknown>).uid === 'string',
    );
  } catch {
    return [];
  }
}

export const aiRoommateMatch = onCall(async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'must be signed in');

  const callerUid = req.auth.uid;
  const db = getFirestore();

  // 1. Load caller profile
  const callerSnap = await db.collection('roommateProfiles').doc(callerUid).get();
  if (!callerSnap.exists) {
    throw new HttpsError('not-found', 'Complete your roommate profile first.');
  }
  const caller = { uid: callerUid, ...callerSnap.data() } as CandidateProfile;

  // 2. Load other active profiles (single where — no composite index)
  const othersSnap = await db
    .collection('roommateProfiles')
    .where('active', '==', true)
    .get();

  const candidates: CandidateProfile[] = othersSnap.docs
    .filter((d) => d.id !== callerUid)
    .slice(0, 50)
    .map((d) => ({ uid: d.id, ...d.data() } as CandidateProfile));

  if (candidates.length === 0) {
    return { matches: [], model: 'claude-sonnet-4-6', candidateCount: 0 };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY ?? '';

  // ── Fallback: no API key ────────────────────────────────────────────────
  if (!apiKey) {
    console.warn('[aiRoommateMatch] ANTHROPIC_API_KEY not set — using JS fallback scoring');
    const ranked = candidates
      .map((c) => ({
        uid:   c.uid,
        score: jsScore(caller, c),
        reason: 'Matched based on budget, zone, and lifestyle compatibility.',
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const matches: MatchResult[] = ranked.map((r) => {
      const c = candidates.find((x) => x.uid === r.uid)!;
      return {
        uid:                r.uid,
        displayName:        c.displayName,
        avatarUrl:          c.avatarUrl ?? '',
        compatibilityScore: r.score,
        matchReason:        r.reason,
        profile: {
          faculty:        c.faculty,
          courseYear:     c.courseYear,
          bio:            c.bio,
          budgetMin:      c.budgetMin,
          budgetMax:      c.budgetMax,
          preferredZones: c.preferredZones,
          lifestyle:      c.lifestyle,
          cleanliness:    c.cleanliness,
          studyHabits:    c.studyHabits,
          lookingFor:     c.lookingFor,
        },
      };
    });

    return { matches, model: 'js-fallback', degraded: true, candidateCount: candidates.length };
  }

  // ── Claude Sonnet 4.6 scoring ───────────────────────────────────────────
  const client = new Anthropic({ apiKey });

  // Strip PII from candidates before sending to Claude
  const sanitized = candidates.map((c) => ({
    uid:              c.uid,
    faculty:          c.faculty,
    courseYear:       c.courseYear,
    bio:              c.bio,
    budgetMin:        c.budgetMin,
    budgetMax:        c.budgetMax,
    preferredZones:   c.preferredZones,
    lifestyle:        c.lifestyle,
    cleanliness:      c.cleanliness,
    studyHabits:      c.studyHabits,
    genderPreference: c.genderPreference,
    smokingOk:        c.smokingOk,
    petsOk:           c.petsOk,
    lookingFor:       c.lookingFor,
  }));

  const seekerPayload = {
    faculty:          caller.faculty,
    courseYear:       caller.courseYear,
    bio:              caller.bio,
    budgetMin:        caller.budgetMin,
    budgetMax:        caller.budgetMax,
    preferredZones:   caller.preferredZones,
    lifestyle:        caller.lifestyle,
    cleanliness:      caller.cleanliness,
    studyHabits:      caller.studyHabits,
    genderPreference: caller.genderPreference,
    smokingOk:        caller.smokingOk,
    petsOk:           caller.petsOk,
    lookingFor:       caller.lookingFor,
  };

  const message = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2048,
    system: `You are a roommate compatibility analyst for students at the University of Buea (UB) in Buea, Cameroon.

Score each candidate's compatibility with the seeker on a scale of 0–100, considering:
- Budget range overlap (can they afford similar accommodation?)
- Zone preference overlap (do they want to live in the same areas?)
- Lifestyle match (early bird vs night owl)
- Cleanliness level match
- Study habits compatibility (silent vs noise-OK)
- Gender preference compatibility
- Smoking/pets preferences alignment
- Looking for the same arrangement (roommate / hostel group / either)

Return ONLY a JSON array of at most 10 objects, sorted by score descending:
[{"uid":"...","score":85,"reason":"One sentence explaining why they are compatible."}]

The reason should be specific and useful (mention concrete matching factors — not generic).
Output nothing else — no prose, no markdown, no explanation.`,
    messages: [
      {
        role:    'user',
        content: `Seeker profile:\n${JSON.stringify(seekerPayload)}\n\nCandidates (${candidates.length} total):\n${JSON.stringify(sanitized)}\n\nRanked matches:`,
      },
    ],
  });

  const raw  = message.content[0]?.type === 'text' ? message.content[0].text : '[]';
  const ranked = parseMatchIds(raw);

  // Build candidate lookup for enrichment
  const candidateMap = Object.fromEntries(candidates.map((c) => [c.uid, c]));

  const matches: MatchResult[] = ranked
    .filter((r) => candidateMap[r.uid])
    .slice(0, 10)
    .map((r) => {
      const c = candidateMap[r.uid]!;
      return {
        uid:                c.uid,
        displayName:        c.displayName,
        avatarUrl:          c.avatarUrl ?? '',
        compatibilityScore: Math.min(100, Math.max(0, Math.round(Number(r.score) || 0))),
        matchReason:        String(r.reason ?? ''),
        profile: {
          faculty:        c.faculty,
          courseYear:     c.courseYear,
          bio:            c.bio,
          budgetMin:      c.budgetMin,
          budgetMax:      c.budgetMax,
          preferredZones: c.preferredZones,
          lifestyle:      c.lifestyle,
          cleanliness:    c.cleanliness,
          studyHabits:    c.studyHabits,
          lookingFor:     c.lookingFor,
        },
      };
    });

  return { matches, model: 'claude-sonnet-4-6', candidateCount: candidates.length };
});

// ── onBookingPaid ────────────────────────────────────────────────────────
/**
 * Fires when a booking flips to 'paid'. Notifies both sides:
 *   landlord → "Booking fee paid — room reserved"
 *   student  → receipt confirmation
 */
export const onBookingPaid = onDocumentUpdated(
  {
    document: 'bookings/{bookingId}',
    region: 'europe-west1',
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after) return;
    if (before.status === after.status || after.status !== 'paid') return;

    const { landlordId, studentId, studentName, listingTitle, bookingFee } = after as {
      landlordId: string;
      studentId: string;
      studentName: string;
      listingTitle: string;
      bookingFee: number;
    };

    const feeText = `${Number(bookingFee).toLocaleString('en-US')} FCFA`;

    await Promise.all([
      landlordId
        ? sendToUser(
            landlordId,
            `Booking fee paid — ${listingTitle}`,
            `${studentName} paid the ${feeText} booking fee. The room is now reserved.`,
            '/dashboard',
            `booking-paid-${event.params.bookingId}`,
          )
        : Promise.resolve(),
      studentId
        ? sendToUser(
            studentId,
            `Room reserved — ${listingTitle}`,
            `Your ${feeText} booking fee was received. Chat with the landlord to arrange move-in.`,
            `/listing/${(after.listingId as string) ?? ''}`,
            `booking-receipt-${event.params.bookingId}`,
          )
        : Promise.resolve(),
    ]);
  },
);

// ── onReviewCreated ──────────────────────────────────────────────────────
/**
 * Recomputes the listing's rating / reviewCount aggregates whenever a review
 * is posted. Runs in a transaction so concurrent reviews don't clobber each
 * other. Aggregates are server-owned — clients can't write them (rules).
 */
export const onReviewCreated = onDocumentCreated(
  {
    document: 'reviews/{reviewId}',
    region: 'europe-west1',
  },
  async (event) => {
    const review = event.data?.data();
    if (!review) return;

    const listingId: string = review.listingId ?? '';
    const rating: number = Number(review.rating) || 0;
    if (!listingId || rating < 1 || rating > 5) return;

    const db = getFirestore();
    const listingRef = db.collection('listings').doc(listingId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(listingRef);
      if (!snap.exists) return;

      const prevCount: number = snap.data()?.reviewCount ?? 0;
      const prevRating: number = snap.data()?.rating ?? 0;
      const newCount = prevCount + 1;
      const newRating = (prevRating * prevCount + rating) / newCount;

      tx.update(listingRef, {
        reviewCount: newCount,
        rating: Math.round(newRating * 10) / 10,
        updatedAt: Date.now(),
      });
    });
  },
);
