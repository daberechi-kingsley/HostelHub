export type VerificationStatus = 'pending' | 'approved' | 'rejected';

/**
 * A landlord/agent's request to be verified by HostelHub.
 * Firestore: verificationRequests/{requestId}
 *
 * `uploaderId` matches the field name in firestore.rules / storage.rules.
 */
export interface VerificationRequest {
  id: string;
  uploaderId: string;
  displayName: string;
  role: 'landlord' | 'agent';
  /** Download URL of the government ID document (image or PDF). */
  idDocUrl: string;
  /** Download URL of the property ownership / management document. */
  propertyDocUrl: string;
  /** Optional context the applicant adds for the reviewer. */
  note?: string;
  status: VerificationStatus;
  submittedAt: number;
  reviewedAt?: number;
  /** Reviewer's reason — shown to the applicant on rejection. */
  reviewerNote?: string;
}
