export type UserRole = 'student' | 'landlord' | 'agent' | 'admin';

export interface AppUser {
  uid: string;
  role: UserRole;
  displayName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  verified: boolean;
  /** Admin-set — a suspended user is blocked from acting on the platform. */
  suspended?: boolean;
  createdAt: number;
  fcmTokens?: string[];
}
