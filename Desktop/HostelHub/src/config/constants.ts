/** University of Buea — anchor point for "distance from UB" calculations */
export const UB_COORDS = { lat: 4.1535, lng: 9.2908 } as const;

/**
 * Working list of Buea zones for v1 filters and listing tagging.
 * Founder will confirm/edit before week 2 seeding.
 */
export const BUEA_ZONES = [
  'Molyko',
  'Bonduma',
  'Mile 16',
  'Mile 17',
  'Mile 18',
  'Bomaka',
  'Sandpit',
  'Great Soppo',
  'Bokwango',
  'Buea Town',
] as const;

export type BueaZone = (typeof BUEA_ZONES)[number];

export const LISTING_TYPES = ['hostel', 'single', 'studio', 'apartment'] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const LISTING_TYPE_LABEL: Record<ListingType, string> = {
  hostel: 'Hostel',
  single: 'Single Room',
  studio: 'Studio',
  apartment: 'Apartment',
};

export const AMENITIES = [
  'water',
  'electricity',
  'wifi',
  'parking',
  'security',
  'kitchen',
  'bathroom_private',
  'furnished',
  'generator',
  'laundry',
  'balcony',
  'study_desk',
] as const;

export type Amenity = (typeof AMENITIES)[number];

export const AMENITY_LABEL: Record<Amenity, string> = {
  water: 'Running water',
  electricity: 'Steady electricity',
  wifi: 'Wi-Fi',
  parking: 'Parking',
  security: 'Security',
  kitchen: 'Kitchen',
  bathroom_private: 'Private bathroom',
  furnished: 'Furnished',
  generator: 'Generator',
  laundry: 'Laundry',
  balcony: 'Balcony',
  study_desk: 'Study desk',
};

/** Price brackets in FCFA per year — used in filter chips */
export const PRICE_BRACKETS = [
  { label: 'Under 200k', min: 0, max: 200_000 },
  { label: '200k – 400k', min: 200_000, max: 400_000 },
  { label: '400k – 700k', min: 400_000, max: 700_000 },
  { label: '700k – 1M', min: 700_000, max: 1_000_000 },
  { label: 'Over 1M', min: 1_000_000, max: Infinity },
] as const;

/** Booking fee = 10% of annual rent (kept for legacy calcs) */
export const BOOKING_FEE_RATE = 0.1;

/** Flat booking fee charged to students — standard across all listings */
export const BOOKING_FEE_FLAT = 25_000;

/**
 * Emails granted admin access in addition to any user with role === 'admin'.
 * The founder's email is here so admin powers work straight after Google sign-in
 * — no manual Firestore edit needed. Mirrored in firestore.rules + storage.rules.
 */
export const ADMIN_EMAILS: readonly string[] = [
  'hostelhubbuea@gmail.com', // dedicated admin account (VITE_ADMIN_EMAIL)
];
