import type { Area } from "./types";

const R_MILES = 3958.8;
const R_METERS = 6371000;

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

export function haversineMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_MILES * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_METERS * Math.asin(Math.min(1, Math.sqrt(s)));
}

export const WESTBROOK: Area = {
  query: "Westbrook",
  label: "Westbrook",
  lat: 43.0489,
  lng: -76.1474,
  radiusMiles: 8,
};

export type PlacePreset = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

export const PLACES: Record<string, PlacePreset> = {
  downtown: {
    name: "Downtown",
    address: "Court Square, Westbrook",
    lat: 43.0489,
    lng: -76.1474,
  },
  officePark: {
    name: "Office park",
    address: "North Campus Dr, Westbrook",
    lat: 43.0712,
    lng: -76.1198,
  },
  dinnerLot: {
    name: "Dinner lot",
    address: "Riverfront Lot, Westbrook",
    lat: 43.0315,
    lng: -76.1682,
  },
  harbor: {
    name: "Harbor Market",
    address: "Harbor St, Westbrook",
    lat: 43.044,
    lng: -76.155,
  },
} as const;

type GeoHit = { label: string; lat: number; lng: number };

const GEOCODER: { keys: string[]; hit: GeoHit }[] = [
  { keys: ["westbrook", "wb"], hit: { label: "Westbrook", lat: 43.0489, lng: -76.1474 } },
  { keys: ["downtown", "court", "13202", "13203"], hit: { label: "Downtown", ...PLACES.downtown } },
  {
    keys: ["office", "campus", "north campus"],
    hit: { label: "Office park", ...PLACES.officePark },
  },
  {
    keys: ["dinner lot", "dinner", "riverfront", "river"],
    hit: { label: "Dinner lot", ...PLACES.dinnerLot },
  },
  { keys: ["harbor", "market"], hit: { label: "Harbor Market", ...PLACES.harbor } },
  { keys: ["syracuse", "13201", "13210"], hit: { label: "Syracuse", lat: 43.0481, lng: -76.1474 } },
  { keys: ["clay", "13041"], hit: { label: "Clay", lat: 43.1865, lng: -76.1733 } },
  { keys: ["liverpool", "13088"], hit: { label: "Liverpool", lat: 43.1065, lng: -76.2177 } },
  { keys: ["rochester", "14604"], hit: { label: "Rochester", lat: 43.1566, lng: -77.6088 } },
  { keys: ["albany", "12207"], hit: { label: "Albany", lat: 42.6526, lng: -73.7562 } },
  { keys: ["buffalo", "14202"], hit: { label: "Buffalo", lat: 42.8864, lng: -78.8784 } },
];

export function geocodeArea(query: string): GeoHit | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  for (const row of GEOCODER) {
    if (row.keys.some((k) => q === k || q.includes(k))) return row.hit;
  }
  return null;
}

export function formatMiles(n: number | null): string | null {
  if (n == null) return null;
  if (n < 0.1) return "<0.1 mi";
  if (n < 10) return `${n.toFixed(1)} mi`;
  return `${Math.round(n)} mi`;
}
