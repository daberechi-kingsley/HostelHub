/**
 * Leaflet map for the listing detail page.
 *
 * Shows two markers:
 *   • Indigo pin  — the listing's exact GPS coordinates.
 *   • Green  pin  — University of Buea main gate (distance reference).
 *
 * Uses L.divIcon with inline SVG so there are zero Vite asset-URL issues
 * with the default Leaflet marker images (no `import markerIcon from …` hacks).
 *
 * This file is only imported from ListingDetailPage, which is a lazy-loaded
 * route → Leaflet + react-leaflet stay in the `map-vendor` chunk and never
 * land in the initial bundle.
 */
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { UB_COORDS } from '@/config/constants';
import { formatDistance } from '@/lib/format/distance';
import type { GeoPoint } from '@/types/listing';

// ── Custom pin icons ────────────────────────────────────────────────────
function makePinIcon(fill: string) {
  return L.divIcon({
    // Teardrop-shaped SVG pin, white inner circle
    html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path fill="${fill}" stroke="white" stroke-width="1.5"
        d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 16 8 16s8-10.5 8-16c0-4.42-3.58-8-8-8z"/>
      <circle fill="white" cx="12" cy="8" r="3.2"/>
    </svg>`,
    className: '',      // override Leaflet's default background/border
    iconSize: [24, 36],
    iconAnchor: [12, 36],   // bottom-center of pin touches the coordinate
    popupAnchor: [0, -38],  // popup appears above the pin
  });
}

const LISTING_ICON = makePinIcon('#4F46E5'); // brand primary (indigo)
const UB_ICON = makePinIcon('#10B981');       // brand verified (emerald)

// ── Component ────────────────────────────────────────────────────────────
interface ListingMapProps {
  geo: GeoPoint;
  title: string;
  distanceFromUbMeters: number;
}

export default function ListingMap({ geo, title, distanceFromUbMeters }: ListingMapProps) {
  // Center the viewport between the listing and UB, biased 2:1 toward listing
  const centerLat = (geo.lat * 2 + UB_COORDS.lat) / 3;
  const centerLng = (geo.lng * 2 + UB_COORDS.lng) / 3;

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={14}
      scrollWheelZoom={false}
      // Keep below sticky header (z-30) and mobile bottom nav (z-20)
      style={{ height: '100%', width: '100%', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Listing marker */}
      <Marker position={[geo.lat, geo.lng]} icon={LISTING_ICON}>
        <Popup>
          <strong className="font-semibold">{title}</strong>
          <br />
          <span className="text-xs text-gray-500">
            {formatDistance(distanceFromUbMeters)} from UB gate
          </span>
        </Popup>
      </Marker>

      {/* UB gate reference marker */}
      <Marker position={[UB_COORDS.lat, UB_COORDS.lng]} icon={UB_ICON}>
        <Popup>
          <strong className="font-semibold">University of Buea</strong>
          <br />
          <span className="text-xs text-gray-500">Main gate</span>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
