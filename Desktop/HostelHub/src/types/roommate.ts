// ── Enums / union types ────────────────────────────────────────────────────────
export type Lifestyle    = 'early_bird' | 'night_owl' | 'flexible';
export type Cleanliness  = 'very_clean' | 'moderate'  | 'relaxed';
export type StudyHabits  = 'silent'     | 'light_noise' | 'noise_ok';
export type GenderPref   = 'any'        | 'same_gender';
export type LookingFor   = 'roommate'   | 'hostel_group' | 'either';

export const COURSE_YEARS = [
  '100L', '200L', '300L', '400L', '500L', 'Masters', 'PhD', 'Staff',
] as const;
export type CourseYear = (typeof COURSE_YEARS)[number];

export const UB_FACULTIES = [
  'Agriculture & Veterinary Medicine',
  'Arts',
  'Economics & Management',
  'Education',
  'Engineering & Technology',
  'Health Sciences',
  'Law & Political Science',
  'Science',
  'Social & Management Sciences',
  'Technology',
  'Medicine & Biomedical Sciences',
  'Other',
] as const;
export type UbFaculty = (typeof UB_FACULTIES)[number];

// ── Core profile ───────────────────────────────────────────────────────────────

/**
 * Stored at `roommateProfiles/{uid}`.
 * Phone and email are intentionally excluded — contact goes through in-app chat.
 */
export interface RoommateProfile {
  uid: string;
  displayName: string;
  avatarUrl: string;
  faculty: string;
  courseYear: string;       // one of CourseYear
  bio: string;              // max 250 chars
  budgetMin: number;        // FCFA / year
  budgetMax: number;
  preferredZones: string[]; // subset of BUEA_ZONES
  lifestyle: Lifestyle;
  cleanliness: Cleanliness;
  studyHabits: StudyHabits;
  genderPreference: GenderPref;
  smokingOk: boolean;
  petsOk: boolean;
  lookingFor: LookingFor;
  active: boolean;          // false = hidden from matching
  updatedAt: number;
}

// ── Match result returned by the Cloud Function ────────────────────────────────

export interface RoommateMatch {
  uid: string;
  displayName: string;
  avatarUrl: string;
  compatibilityScore: number;   // 0–100
  matchReason: string;           // one sentence from Claude
  profile: {
    faculty: string;
    courseYear: string;
    bio: string;
    budgetMin: number;
    budgetMax: number;
    preferredZones: string[];
    lifestyle: Lifestyle;
    cleanliness: Cleanliness;
    studyHabits: StudyHabits;
    lookingFor: LookingFor;
  };
}

// ── Display helpers ────────────────────────────────────────────────────────────

export const LIFESTYLE_LABEL: Record<Lifestyle, string> = {
  early_bird: '🌅 Early bird',
  night_owl:  '🦉 Night owl',
  flexible:   '🌊 Flexible',
};

export const CLEANLINESS_LABEL: Record<Cleanliness, string> = {
  very_clean: '✨ Very clean',
  moderate:   '👍 Moderate',
  relaxed:    '🛋 Relaxed',
};

export const STUDY_LABEL: Record<StudyHabits, string> = {
  silent:      '🤫 Silent study',
  light_noise: '🎵 Light noise OK',
  noise_ok:    '🎶 Noise fine',
};

export const LOOKING_FOR_LABEL: Record<LookingFor, string> = {
  roommate:     '🏠 Roommate',
  hostel_group: '🏘 Hostel group',
  either:       '🤝 Either',
};

export const GENDER_PREF_LABEL: Record<GenderPref, string> = {
  any:         'Any gender',
  same_gender: 'Same gender only',
};
