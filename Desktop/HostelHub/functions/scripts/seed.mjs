/**
 * Seeds the Firestore emulator with Buea listings + the config/global doc.
 *
 * Run (from repo root):  npm run seed
 * Requires the Firebase emulators to be running.
 *
 * Uses the Admin SDK with FIRESTORE_EMULATOR_HOST set, which writes directly
 * and bypasses security rules — exactly what we want for seeding.
 *
 * Idempotent: deterministic doc IDs (lst-001 …) so re-running overwrites.
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Point the Admin SDK at the local emulator BEFORE initializing.
process.env.FIRESTORE_EMULATOR_HOST ||= 'localhost:8080';
const PROJECT_ID = 'demo-hostelhub';

initializeApp({ projectId: PROJECT_ID });
const db = getFirestore();

// --- University of Buea anchor for distance-from-UB ---
const UB = { lat: 4.1559, lng: 9.281 };

function haversineMeters(a, b) {
  const R = 6_371_000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

const DAY = 1000 * 60 * 60 * 24;
const now = Date.now();

/** Compact listing definitions — distance is computed from geo below. */
const RAW = [
  ['single', 'Quiet single room near UB gate', 'Molyko', 'Off Checkpoint, Molyko', 4.158, 9.286, 220000, true, 4.6, 12, ['water', 'electricity', 'security', 'study_desk'], 1],
  ['studio', 'Furnished studio with kitchenette', 'Bonduma', 'Bonduma Junction', 4.149, 9.272, 480000, true, 4.8, 28, ['water', 'electricity', 'wifi', 'kitchen', 'bathroom_private', 'furnished'], 2],
  ['hostel', 'Affordable hostel bed, shared room', 'Mile 16', 'Mile 16 main road', 4.139, 9.265, 165000, false, 4.1, 7, ['water', 'electricity', 'security', 'kitchen', 'generator'], 3],
  ['apartment', 'Two-bedroom apartment for roommates', 'Great Soppo', 'Soppo, behind the market', 4.162, 9.295, 950000, true, 4.9, 41, ['water', 'electricity', 'wifi', 'parking', 'furnished', 'balcony', 'laundry'], 4],
  ['single', 'Cozy room with study desk', 'Molyko', 'Behind Molyko stadium', 4.157, 9.282, 250000, false, 4.3, 5, ['water', 'electricity', 'study_desk', 'kitchen'], 5],
  ['studio', 'Studio with private bathroom & balcony', 'Bomaka', 'Bomaka, off the main road', 4.144, 9.27, 420000, true, 4.5, 14, ['water', 'electricity', 'wifi', 'bathroom_private', 'balcony', 'kitchen'], 6],
  ['single', 'Sunny single in a calm compound', 'Molyko', 'Clerks Quarter, Molyko', 4.156, 9.284, 240000, true, 4.4, 9, ['water', 'electricity', 'security', 'kitchen'], 7],
  ['hostel', 'Female-only hostel, 2 per room', 'Bonduma', 'Bonduma upper', 4.151, 9.274, 200000, true, 4.7, 22, ['water', 'electricity', 'security', 'wifi', 'laundry'], 8],
  ['apartment', 'Spacious 3-bedroom family flat', 'Buea Town', 'Buea Town, near GHS', 4.165, 9.245, 1100000, true, 4.8, 33, ['water', 'electricity', 'parking', 'furnished', 'balcony', 'kitchen'], 9],
  ['single', 'Budget room close to Mile 17 park', 'Mile 17', 'Mile 17 motor park', 4.135, 9.26, 150000, false, 3.9, 4, ['water', 'electricity'], 10],
  ['studio', 'Modern self-contained studio', 'Sandpit', 'Sandpit residential', 4.152, 9.29, 390000, true, 4.6, 17, ['water', 'electricity', 'wifi', 'bathroom_private', 'kitchen'], 11],
  ['single', 'Furnished room with steady power', 'Bomaka', 'Bomaka junction', 4.143, 9.269, 270000, false, 4.2, 6, ['water', 'electricity', 'furnished', 'generator', 'study_desk'], 12],
  ['apartment', 'Two-bedroom with parking & balcony', 'Bonduma', 'Bonduma main', 4.15, 9.273, 820000, true, 4.7, 19, ['water', 'electricity', 'wifi', 'parking', 'balcony', 'kitchen'], 13],
  ['hostel', 'Mixed hostel with communal kitchen', 'Mile 18', 'Mile 18 roadside', 4.13, 9.255, 175000, false, 4.0, 8, ['water', 'electricity', 'security', 'kitchen', 'generator'], 14],
  ['single', 'Tiled single room, water guaranteed', 'Great Soppo', 'Soppo new layout', 4.161, 9.293, 260000, true, 4.5, 11, ['water', 'electricity', 'security', 'study_desk'], 15],
  ['studio', 'Bright studio near Bokwango quarter', 'Bokwango', 'Bokwango, quiet street', 4.17, 9.27, 360000, false, 4.3, 7, ['water', 'electricity', 'bathroom_private', 'kitchen', 'balcony'], 16],
  ['single', 'Affordable room, walk to campus', 'Molyko', 'Dirty South, Molyko', 4.159, 9.285, 210000, false, 4.1, 13, ['water', 'electricity', 'kitchen'], 17],
  ['apartment', 'Premium furnished apartment', 'Sandpit', 'Sandpit hilltop', 4.154, 9.291, 1300000, true, 5.0, 26, ['water', 'electricity', 'wifi', 'parking', 'furnished', 'balcony', 'laundry', 'security'], 18],
];

const OWNERS = ['seed-landlord-1', 'seed-landlord-2', 'seed-landlord-3', 'seed-agent-1', 'seed-agent-2'];

/** Two listings left at status 'pending' so the admin dashboard has something to activate. */
const PENDING_RAW = [
  ['single', 'New room awaiting review near UB', 'Molyko', 'Molyko, behind UB campus', 4.157, 9.283, 230000, false, 0, 0, ['water', 'electricity', 'study_desk'], 19],
  ['studio', 'Studio pending activation', 'Bonduma', 'Bonduma main road', 4.15, 9.273, 410000, false, 0, 0, ['water', 'electricity', 'wifi', 'kitchen'], 20],
];

function buildListing(row, index, status = 'active') {
  const [type, title, zone, address, lat, lng, price, verified, rating, reviewCount, amenities, n] = row;
  const geo = { lat, lng };
  const ownerId = OWNERS[index % OWNERS.length];
  const ownerRole = ownerId.includes('agent') ? 'agent' : 'landlord';
  const pad = String(n).padStart(3, '0');
  return {
    id: `lst-${pad}`,
    data: {
      ownerId,
      ownerRole,
      type,
      title,
      description: `${title}. Located in ${zone}, ${address}. ${
        verified ? 'This property and its owner are verified by HostelHub.' : 'Verification pending.'
      } Reach out in-app to ask questions or schedule a visit.`,
      pricePerYear: price,
      zone,
      address,
      geo,
      distanceFromUbMeters: haversineMeters(UB, geo),
      amenities,
      photos: [
        `https://picsum.photos/seed/hostelhub-${pad}a/800/600`,
        `https://picsum.photos/seed/hostelhub-${pad}b/800/600`,
        `https://picsum.photos/seed/hostelhub-${pad}c/800/600`,
      ],
      status,
      verified,
      rating,
      reviewCount,
      createdAt: now - index * DAY,
      updatedAt: now - index * (DAY / 2),
    },
  };
}

async function seed() {
  console.log(`Seeding Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST} …`);

  const batch = db.batch();
  const listings = [
    ...RAW.map((row, i) => buildListing(row, i, 'active')),
    ...PENDING_RAW.map((row, i) => buildListing(row, RAW.length + i, 'pending')),
  ];
  for (const { id, data } of listings) {
    batch.set(db.collection('listings').doc(id), data);
  }

  // Global config — the chat-mode flag the whole product hinges on.
  batch.set(db.collection('config').doc('global'), {
    chatMode: 'concierge', // 'concierge' | 'direct' — flip to switch routing, no rebuild
    conciergeUid: null, // set once the concierge account exists
    features: {
      aiSearch: true,
      roommateMatch: true,
      booking: true,
    },
    updatedAt: now,
  });

  await batch.commit();
  console.log(`  ✓ ${listings.length} listings written`);
  console.log('  ✓ config/global written (chatMode=concierge)');
  console.log('Done.');
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
