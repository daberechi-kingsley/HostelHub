/**
 * Firestore CRUD + Cloud Function callable for the Roommate Matching feature.
 *
 * Collection: roommateProfiles/{uid}   (one doc per user — uid is the doc ID)
 * Cloud Function: aiRoommateMatch      (Claude Sonnet 4.6, europe-west1)
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseDb, getFirebaseApp } from '@/lib/firebase';
import type { RoommateProfile, RoommateMatch } from '@/types/roommate';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getFunctionsClient() {
  return getFunctions(getFirebaseApp(), 'europe-west1');
}

function snapToProfile(uid: string, data: Record<string, unknown>): RoommateProfile {
  return {
    uid,
    displayName:      (data.displayName      as string)   ?? '',
    avatarUrl:        (data.avatarUrl        as string)   ?? '',
    faculty:          (data.faculty          as string)   ?? '',
    courseYear:       (data.courseYear       as string)   ?? '100L',
    bio:              (data.bio              as string)   ?? '',
    budgetMin:        (data.budgetMin        as number)   ?? 150_000,
    budgetMax:        (data.budgetMax        as number)   ?? 500_000,
    preferredZones:   (data.preferredZones   as string[]) ?? [],
    lifestyle:        (data.lifestyle        as RoommateProfile['lifestyle'])   ?? 'flexible',
    cleanliness:      (data.cleanliness      as RoommateProfile['cleanliness']) ?? 'moderate',
    studyHabits:      (data.studyHabits      as RoommateProfile['studyHabits']) ?? 'light_noise',
    genderPreference: (data.genderPreference as RoommateProfile['genderPreference']) ?? 'any',
    smokingOk:        (data.smokingOk        as boolean)  ?? false,
    petsOk:           (data.petsOk           as boolean)  ?? false,
    lookingFor:       (data.lookingFor       as RoommateProfile['lookingFor'])   ?? 'either',
    active:           (data.active           as boolean)  ?? true,
    updatedAt:        (data.updatedAt        as number)   ?? 0,
  };
}

// ── Firestore reads / writes ───────────────────────────────────────────────────

/**
 * Fetch the current user's roommate profile (O(1) direct read).
 * Returns null if the user hasn't filled in the questionnaire yet.
 */
export async function getMyRoommateProfile(uid: string): Promise<RoommateProfile | null> {
  const snap = await getDoc(doc(getFirebaseDb(), 'roommateProfiles', uid));
  if (!snap.exists()) return null;
  return snapToProfile(uid, snap.data() as Record<string, unknown>);
}

/**
 * Create or fully replace the current user's roommate profile.
 * `active: true` makes them visible to other students' matches.
 */
export async function saveRoommateProfile(
  uid: string,
  data: Omit<RoommateProfile, 'uid' | 'updatedAt' | 'active'> & { active?: boolean },
): Promise<void> {
  await setDoc(doc(getFirebaseDb(), 'roommateProfiles', uid), {
    ...data,
    uid,
    active: data.active ?? true,
    updatedAt: Date.now(),
  });
}

/**
 * Toggle the `active` flag without touching any other fields.
 * active=false hides the user from others' match results.
 */
export async function setRoommateActive(uid: string, active: boolean): Promise<void> {
  await setDoc(
    doc(getFirebaseDb(), 'roommateProfiles', uid),
    { active, updatedAt: Date.now() },
    { merge: true },
  );
}

// ── Cloud Function callable ───────────────────────────────────────────────────

interface AiRoommateMatchResult {
  matches: RoommateMatch[];
  model: string;
  degraded?: boolean;
  candidateCount?: number;
}

/**
 * Calls the `aiRoommateMatch` Cloud Function (Claude Sonnet 4.6).
 * The function loads all active profiles, scores them against the caller,
 * and returns the top 10 matches sorted by compatibility score.
 */
export async function fetchRoommateMatches(): Promise<AiRoommateMatchResult> {
  const fn = httpsCallable<void, AiRoommateMatchResult>(
    getFunctionsClient(),
    'aiRoommateMatch',
  );
  const result = await fn();
  return result.data;
}
