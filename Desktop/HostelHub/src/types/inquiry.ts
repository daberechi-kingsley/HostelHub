export type VisitStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled';

/**
 * A student's visit request for a specific listing.
 *
 * Doc ID: `${studentId}_${listingId}` — one active request per student per
 * listing, O(1) lookup, no composite index required.
 */
export interface VisitRequest {
  id: string;               // Firestore doc ID
  studentId: string;
  studentName: string;
  landlordId: string;
  listingId: string;
  listingTitle: string;
  proposedDate: string;     // 'YYYY-MM-DD'
  proposedSlot: string;     // e.g. '2:00 PM – 4:00 PM'
  message: string;
  status: VisitStatus;
  responseNote: string;     // landlord's optional reply on confirm/decline
  createdAt: number;
  updatedAt: number;
}
