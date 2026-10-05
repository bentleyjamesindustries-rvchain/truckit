export const CUISINES = [
  "bbq",
  "burgers",
  "tacos_mexican",
  "pizza",
  "seafood",
  "asian",
  "indian",
  "mediterranean",
  "soul_food",
  "coffee_dessert",
  "breakfast",
  "vegan_veg",
  "fusion",
  "other",
] as const;

export type Cuisine = (typeof CUISINES)[number];

export const CUISINE_LABEL: Record<Cuisine, string> = {
  bbq: "BBQ",
  burgers: "Burgers",
  tacos_mexican: "Tacos",
  pizza: "Pizza",
  seafood: "Seafood",
  asian: "Asian",
  indian: "Indian",
  mediterranean: "Mediterranean",
  soul_food: "Soul food",
  coffee_dessert: "Coffee & dessert",
  breakfast: "Breakfast",
  vegan_veg: "Vegan / veg",
  fusion: "Fusion",
  other: "Other",
};

export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "gluten_free",
  "halal",
  "kosher",
  "nut_free",
] as const;

export type DietaryTag = (typeof DIETARY_TAGS)[number];

export const DIETARY_LABEL: Record<DietaryTag, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  gluten_free: "Gluten free",
  halal: "Halal",
  kosher: "Kosher",
  nut_free: "Nut free",
};

export type TruckStatus = "draft" | "live" | "paused";
export type StopStatus = "scheduled" | "here" | "delayed" | "closed" | "ended";
export type WindowKind = "breakfast" | "lunch" | "dinner" | "late_night";
export type UserRole = "consumer" | "operator" | "admin";
export type MeetupStatus = "scheduled" | "live" | "cancelled" | "ended";

export type Stop = {
  id: string;
  truckId: string;
  meetupId: string | null;
  title: string | null;
  placeName: string;
  address: string;
  lat: number;
  lng: number;
  placeNotes: string | null;
  startsAt: string;
  endsAt: string;
  recurrence: "once" | "weekly";
  status: StopStatus;
  delayMinutes: number | null;
  closedReason: string | null;
  liveCheckedInAt: string | null;
  liveLat: number | null;
  liveLng: number | null;
};

export type Truck = {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string | null;
  status: TruckStatus;
  primaryCuisine: Cuisine;
  secondaryCuisines: Cuisine[];
  bio: string | null;
  serviceCity: string;
  serviceRegion: string | null;
  serviceLat: number | null;
  serviceLng: number | null;
  coverTone: string;
  dietaryTags: DietaryTag[];
  priceBand: "1" | "2" | "3" | null;
  typicalWindows: WindowKind[];
  publicPhone: string | null;
  phonePublic: boolean;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  websiteUrl: string | null;
  timezone: string;
  isDemo: boolean;
  foundingTruck: boolean;
};

export type TruckListItem = {
  id: string;
  name: string;
  slug: string | null;
  primaryCuisine: Cuisine;
  secondaryCuisines: Cuisine[];
  coverTone: string;
  dietaryTags: DietaryTag[];
  priceBand: "1" | "2" | "3" | null;
  serviceCity: string;
  timezone: string;
  lat: number;
  lng: number;
  distanceMiles: number | null;
  isOpenNow: boolean;
  statusKind: "here" | "delayed" | "window" | "upcoming" | "none";
  statusLabel: string;
  nextStop: Stop | null;
  foundingTruck: boolean;
};

export type MeetupListItem = {
  id: string;
  name: string;
  description: string | null;
  placeName: string;
  address: string;
  lat: number;
  lng: number;
  startsAt: string;
  endsAt: string;
  status: MeetupStatus;
  joinMode: "open" | "invite";
  maxTrucks: number | null;
  coverTone: string;
  hostTruckId: string;
  hostTruckName: string;
  memberCount: number;
  distanceMiles: number | null;
};

export type MarketListItem = {
  id: string;
  name: string;
  placeName: string;
  address: string;
  lat: number;
  lng: number;
  cityId: string;
  cityName: string;
  cadence: string;
  season: string | null;
  notes: string | null;
  coverTone: string;
  windowKind: "lunch" | "dinner" | "mixed";
  distanceMiles: number | null;
  liveCount: number;
};

export type Area = {
  query: string;
  label: string;
  lat: number;
  lng: number;
  radiusMiles: number;
  stateCode: string;
  countyId: string;
  cityId: string;
  countyName?: string;
};

export type CatalogFilters = {
  openNow: boolean;
  lunch: boolean;
  dinner: boolean;
  late: boolean;
  cuisines: Cuisine[];
};
