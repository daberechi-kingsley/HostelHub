import type { Amenity, BueaZone, ListingType } from '@/config/constants';

export type ListingStatus =
  | 'draft'
  | 'pending'
  | 'active'
  | 'reserved'
  | 'rented'
  | 'rejected';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Listing {
  id: string;
  ownerId: string;
  ownerRole: 'landlord' | 'agent';
  type: ListingType;
  title: string;
  description: string;
  pricePerYear: number;
  zone: BueaZone;
  address: string;
  geo: GeoPoint;
  distanceFromUbMeters: number;
  amenities: Amenity[];
  photos: string[];
  videoUrl?: string;
  status: ListingStatus;
  /** Admin's reason when status === 'rejected' — surfaced to the landlord. */
  rejectionReason?: string;
  verified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: number;
  updatedAt: number;
}
