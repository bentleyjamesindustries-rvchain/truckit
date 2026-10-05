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

export type GeoState = { code: string; name: string; fips: string };
export type GeoCounty = { id: string; stateCode: string; name: string; fips: string };
export type GeoCity = {
  id: string;
  countyId: string;
  stateCode: string;
  name: string;
  lat: number;
  lng: number;
};

export const GEO_STATES: GeoState[] = [{ code: "NY", name: "New York", fips: "36" }];

export const GEO_COUNTIES: GeoCounty[] = [
  { id: "ny-onondaga", stateCode: "NY", name: "Onondaga", fips: "36067" },
  { id: "ny-monroe", stateCode: "NY", name: "Monroe", fips: "36055" },
  { id: "ny-erie", stateCode: "NY", name: "Erie", fips: "36029" },
  { id: "ny-albany", stateCode: "NY", name: "Albany", fips: "36001" },
];

export const GEO_CITIES: GeoCity[] = [
  { id: "ny-onondaga-syracuse", countyId: "ny-onondaga", stateCode: "NY", name: "Syracuse", lat: 43.0481, lng: -76.1474 },
  { id: "ny-onondaga-clay", countyId: "ny-onondaga", stateCode: "NY", name: "Clay", lat: 43.1865, lng: -76.1733 },
  { id: "ny-onondaga-mattydale", countyId: "ny-onondaga", stateCode: "NY", name: "Mattydale", lat: 43.0981, lng: -76.1435 },
  { id: "ny-onondaga-liverpool", countyId: "ny-onondaga", stateCode: "NY", name: "Liverpool", lat: 43.1065, lng: -76.2177 },
  { id: "ny-onondaga-east-syracuse", countyId: "ny-onondaga", stateCode: "NY", name: "East Syracuse", lat: 43.0653, lng: -76.0613 },
  { id: "ny-monroe-rochester", countyId: "ny-monroe", stateCode: "NY", name: "Rochester", lat: 43.1566, lng: -77.6088 },
  { id: "ny-erie-buffalo", countyId: "ny-erie", stateCode: "NY", name: "Buffalo", lat: 42.8864, lng: -78.8784 },
  { id: "ny-albany-albany", countyId: "ny-albany", stateCode: "NY", name: "Albany", lat: 42.6526, lng: -73.7562 },
];

export const SYRACUSE_CITY = GEO_CITIES[0]!;

export const SYRACUSE: Area = {
  query: "Syracuse",
  label: "Syracuse",
  lat: SYRACUSE_CITY.lat,
  lng: SYRACUSE_CITY.lng,
  radiusMiles: 12,
  stateCode: "NY",
  countyId: "ny-onondaga",
  cityId: "ny-onondaga-syracuse",
};

export type PlacePreset = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  cityId: string;
  cityName: string;
};

export type MarketSeed = PlacePreset & {
  id: string;
  cadence: string;
  season: string | null;
  notes: string;
  coverTone: string;
  windowKind: "lunch" | "dinner" | "mixed";
};

export const LOTS: MarketSeed[] = [
  {
    id: "mkt-great-northern",
    name: "Great Northern Mall",
    address: "4155 State Route 31, Clay, NY 13041",
    lat: 43.1828,
    lng: -76.2297,
    cityId: "ny-onondaga-clay",
    cityName: "Clay",
    cadence: "Wed 4–8pm",
    season: "Apr 15–Oct 14 2026",
    notes: "~20–25 trucks. Soft-launch recruit home.",
    coverTone: "ember",
    windowKind: "dinner",
  },
  {
    id: "mkt-cny-thursday",
    name: "CNY Regional Market",
    address: "2100 Park St, Syracuse, NY 13208",
    lat: 43.0716,
    lng: -76.1372,
    cityId: "ny-onondaga-syracuse",
    cityName: "Syracuse",
    cadence: "Thu 4–8pm · #SYRFoodTrucks",
    season: "May–Oct 2026",
    notes: "A-Shed Thursday takeover.",
    coverTone: "harbor",
    windowKind: "dinner",
  },
  {
    id: "mkt-northern-lights",
    name: "Northern Lights Plaza",
    address: "Brewerton Rd, Mattydale, NY 13211",
    lat: 43.0978,
    lng: -76.1445,
    cityId: "ny-onondaga-mattydale",
    cityName: "Mattydale",
    cadence: "Tue 4–8pm",
    season: "Summer 2026",
    notes: "Tuesday plaza lot.",
    coverTone: "steel",
    windowKind: "dinner",
  },
  {
    id: "mkt-everson",
    name: "Everson Food Truck Fridays",
    address: "401 Harrison St, Syracuse, NY 13202",
    lat: 43.0469,
    lng: -76.1495,
    cityId: "ny-onondaga-syracuse",
    cityName: "Syracuse",
    cadence: "Fri 11am–2pm",
    season: "Lunch season",
    notes: "Downtown museum lunch.",
    coverTone: "lotus",
    windowKind: "lunch",
  },
  {
    id: "mkt-upstate",
    name: "Upstate Medical",
    address: "750 E Adams St, Syracuse, NY 13210",
    lat: 43.0419,
    lng: -76.1397,
    cityId: "ny-onondaga-syracuse",
    cityName: "Syracuse",
    cadence: "Weekday lunch 11am–2pm",
    season: "Calendar-based",
    notes: "Hospital campus lunch rotation.",
    coverTone: "finch",
    windowKind: "lunch",
  },
  {
    id: "mkt-harveys",
    name: "Harvey's Garden",
    address: "1200 E Water St, Syracuse, NY 13210",
    lat: 43.0478,
    lng: -76.1325,
    cityId: "ny-onondaga-syracuse",
    cityName: "Syracuse",
    cadence: "Evenings + weekends",
    season: "Year-round park",
    notes: "Syracuse food truck park & beer hall.",
    coverTone: "copper",
    windowKind: "mixed",
  },
  {
    id: "mkt-traditions",
    name: "Traditions Concerts",
    address: "East Syracuse, NY 13057",
    lat: 43.0705,
    lng: -76.0618,
    cityId: "ny-onondaga-east-syracuse",
    cityName: "East Syracuse",
    cadence: "Wed concerts",
    season: "Summer 2026",
    notes: "Traditions at the Links concert nights.",
    coverTone: "harbor",
    windowKind: "dinner",
  },
  {
    id: "mkt-cny-weekend",
    name: "CNY Market Weekends",
    address: "2100 Park St, Syracuse, NY 13208",
    lat: 43.0716,
    lng: -76.1372,
    cityId: "ny-onondaga-syracuse",
    cityName: "Syracuse",
    cadence: "Sat–Sun · 1–2 trucks",
    season: "May–Oct 2026",
    notes: "Quieter weekend stand at the Regional Market.",
    coverTone: "steel",
    windowKind: "mixed",
  },
];

export const PLACES: Record<string, PlacePreset> = Object.fromEntries(
  LOTS.map((lot) => [
    lot.id,
    {
      name: lot.name,
      address: lot.address,
      lat: lot.lat,
      lng: lot.lng,
      cityId: lot.cityId,
      cityName: lot.cityName,
    },
  ]),
) as Record<string, PlacePreset>;

export const PLACE_OPTS: PlacePreset[] = LOTS.map((lot) => ({
  name: lot.name,
  address: lot.address,
  lat: lot.lat,
  lng: lot.lng,
  cityId: lot.cityId,
  cityName: lot.cityName,
}));

export function countiesForState(code: string): GeoCounty[] {
  return GEO_COUNTIES.filter((c) => c.stateCode === code);
}

export function citiesForCounty(countyId: string): GeoCity[] {
  return GEO_CITIES.filter((c) => c.countyId === countyId);
}

export function cityById(id: string): GeoCity | undefined {
  return GEO_CITIES.find((c) => c.id === id);
}

export function areaFromCity(city: GeoCity, radiusMiles = 12): Area {
  const county = GEO_COUNTIES.find((c) => c.id === city.countyId);
  return {
    query: city.name,
    label: city.name,
    lat: city.lat,
    lng: city.lng,
    radiusMiles,
    stateCode: city.stateCode,
    countyId: city.countyId,
    cityId: city.id,
    countyName: county?.name,
  };
}

export function nearestCity(lat: number, lng: number): GeoCity {
  let best = GEO_CITIES[0]!;
  let bestD = Infinity;
  for (const city of GEO_CITIES) {
    const d = haversineMiles({ lat, lng }, city);
    if (d < bestD) {
      bestD = d;
      best = city;
    }
  }
  return best;
}

export function geocodeArea(query: string): GeoCity | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const exact = GEO_CITIES.find((c) => c.name.toLowerCase() === q);
  if (exact) return exact;
  const partial = GEO_CITIES.find((c) => c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()));
  if (partial) return partial;
  const zip: Record<string, string> = {
    "13202": "ny-onondaga-syracuse",
    "13203": "ny-onondaga-syracuse",
    "13208": "ny-onondaga-syracuse",
    "13210": "ny-onondaga-syracuse",
    "13041": "ny-onondaga-clay",
    "13211": "ny-onondaga-mattydale",
    "13088": "ny-onondaga-liverpool",
    "13057": "ny-onondaga-east-syracuse",
    "14604": "ny-monroe-rochester",
    "14202": "ny-erie-buffalo",
    "12207": "ny-albany-albany",
  };
  const z = zip[q.replace(/\s/g, "")];
  return z ? cityById(z) ?? null : null;
}

export function formatMiles(n: number | null): string | null {
  if (n == null) return null;
  if (n < 0.1) return "<0.1 mi";
  if (n < 10) return `${n.toFixed(1)} mi`;
  return `${Math.round(n)} mi`;
}
