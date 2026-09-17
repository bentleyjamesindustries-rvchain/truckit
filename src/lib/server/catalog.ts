import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { haversineMiles } from "@/lib/geo";
import { pickNextStop, statusLabel, stopWindow } from "@/lib/time";
import type {
  CatalogFilters,
  Cuisine,
  DietaryTag,
  MeetupListItem,
  Stop,
  StopStatus,
  Truck,
  TruckListItem,
  WindowKind,
} from "@/lib/types";
import { ensureDemoCatalog } from "./seed";

type TruckRow = {
  id: string;
  owner_user_id: string;
  name: string;
  slug: string | null;
  status: Truck["status"];
  primary_cuisine: Cuisine;
  secondary_cuisines: Cuisine[] | string;
  bio: string | null;
  service_city: string;
  service_region: string | null;
  service_lat: number | null;
  service_lng: number | null;
  cover_tone: string;
  dietary_tags: DietaryTag[] | string;
  price_band: "1" | "2" | "3" | null;
  typical_windows: WindowKind[] | string;
  public_phone: string | null;
  phone_public: boolean;
  instagram_url: string | null;
  tiktok_url: string | null;
  website_url: string | null;
  timezone: string;
};

type StopRow = {
  id: string;
  truck_id: string;
  meetup_id: string | null;
  title: string | null;
  place_name: string;
  address: string;
  lat: number;
  lng: number;
  place_notes: string | null;
  starts_at: string;
  ends_at: string;
  recurrence: "once" | "weekly";
  status: StopStatus;
  delay_minutes: number | null;
  closed_reason: string | null;
  live_checked_in_at: string | null;
  live_lat: number | null;
  live_lng: number | null;
};

function parseJson<T>(value: T | string | null | undefined, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value;
}

export function mapTruck(row: TruckRow): Truck {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    primaryCuisine: row.primary_cuisine,
    secondaryCuisines: parseJson<Cuisine[]>(row.secondary_cuisines, []),
    bio: row.bio,
    serviceCity: row.service_city,
    serviceRegion: row.service_region,
    serviceLat: row.service_lat,
    serviceLng: row.service_lng,
    coverTone: row.cover_tone,
    dietaryTags: parseJson<DietaryTag[]>(row.dietary_tags, []),
    priceBand: row.price_band,
    typicalWindows: parseJson<WindowKind[]>(row.typical_windows, []),
    publicPhone: row.public_phone,
    phonePublic: row.phone_public,
    instagramUrl: row.instagram_url,
    tiktokUrl: row.tiktok_url,
    websiteUrl: row.website_url,
    timezone: row.timezone,
  };
}

export function mapStop(row: StopRow): Stop {
  return {
    id: row.id,
    truckId: row.truck_id,
    meetupId: row.meetup_id,
    title: row.title,
    placeName: row.place_name,
    address: row.address,
    lat: Number(row.lat),
    lng: Number(row.lng),
    placeNotes: row.place_notes,
    startsAt: typeof row.starts_at === "string" ? row.starts_at : new Date(row.starts_at).toISOString(),
    endsAt: typeof row.ends_at === "string" ? row.ends_at : new Date(row.ends_at).toISOString(),
    recurrence: row.recurrence,
    status: row.status,
    delayMinutes: row.delay_minutes,
    closedReason: row.closed_reason,
    liveCheckedInAt: row.live_checked_in_at
      ? typeof row.live_checked_in_at === "string"
        ? row.live_checked_in_at
        : new Date(row.live_checked_in_at).toISOString()
      : null,
    liveLat: row.live_lat != null ? Number(row.live_lat) : null,
    liveLng: row.live_lng != null ? Number(row.live_lng) : null,
  };
}

function stopMatchesFilters(stop: Stop, truck: Truck, filters: CatalogFilters): boolean {
  const win = stopWindow(stop, truck.timezone);
  const lunchOn = filters.lunch;
  const dinnerOn = filters.dinner;
  const lateOn = filters.late;
  const anyWindow = lunchOn || dinnerOn || lateOn;
  if (anyWindow) {
    if (lunchOn && win === "lunch") return true;
    if (dinnerOn && win === "dinner") return true;
    if (lateOn && win === "late_night") return true;
    return false;
  }
  return win !== "late_night";
}

function sortItems(a: TruckListItem, b: TruckListItem): number {
  const rank = (x: TruckListItem) => {
    if (x.isOpenNow) return 0;
    if (x.nextStop) return 1;
    return 2;
  };
  const r = rank(a) - rank(b);
  if (r !== 0) return r;
  if (a.nextStop && b.nextStop) {
    const dt = new Date(a.nextStop.startsAt).getTime() - new Date(b.nextStop.startsAt).getTime();
    if (dt !== 0) return dt;
  }
  return a.name.localeCompare(b.name);
}

export const listTrucks = createServerFn({ method: "POST" })
  .validator(
    (input: {
      lat: number;
      lng: number;
      radiusMiles: number;
      filters: CatalogFilters;
    }) => input,
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureDemoCatalog(sql);
    const trucks = (await sql<TruckRow>`select * from trucks where status = 'live'`).map(mapTruck);
    const stops = (
      await sql<StopRow>`
        select * from stops
        where status in ('scheduled', 'here', 'delayed')
          and ends_at > now() - interval '1 hour'
        order by starts_at asc
      `
    ).map(mapStop);

    const byTruck = new Map<string, Stop[]>();
    for (const s of stops) {
      const list = byTruck.get(s.truckId) ?? [];
      list.push(s);
      byTruck.set(s.truckId, list);
    }

    const origin = { lat: data.lat, lng: data.lng };
    const items: TruckListItem[] = [];
    for (const truck of trucks) {
      if (data.filters.cuisines.length > 0) {
        const set = new Set([truck.primaryCuisine, ...truck.secondaryCuisines]);
        if (!data.filters.cuisines.some((c) => set.has(c))) continue;
      }
      const truckStops = byTruck.get(truck.id) ?? [];
      const filteredStops = truckStops.filter((s) => stopMatchesFilters(s, truck, data.filters));
      const next = pickNextStop(filteredStops);
      const live = filteredStops.find((s) => s.status === "here" || s.status === "delayed") ?? next;
      const pin = live
        ? { lat: live.liveLat ?? live.lat, lng: live.liveLng ?? live.lng }
        : truck.serviceLat != null && truck.serviceLng != null
          ? { lat: truck.serviceLat, lng: truck.serviceLng }
          : null;
      if (!pin) continue;
      const distanceMiles = haversineMiles(origin, pin);
      if (distanceMiles > data.radiusMiles) continue;
      const label = statusLabel(next, truck.timezone);
      if (data.filters.openNow && !label.open) continue;
      if (data.filters.lunch || data.filters.dinner || data.filters.late) {
        if (!next) continue;
      }
      items.push({
        id: truck.id,
        name: truck.name,
        slug: truck.slug,
        primaryCuisine: truck.primaryCuisine,
        secondaryCuisines: truck.secondaryCuisines,
        coverTone: truck.coverTone,
        dietaryTags: truck.dietaryTags,
        priceBand: truck.priceBand,
        serviceCity: truck.serviceCity,
        timezone: truck.timezone,
        lat: pin.lat,
        lng: pin.lng,
        distanceMiles,
        isOpenNow: label.open,
        statusKind: label.kind,
        statusLabel: label.text,
        nextStop: next,
      });
    }
    items.sort(sortItems);
    return { items, totalLive: trucks.length };
  });

export const getTruck = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureDemoCatalog(sql);
    const rows = await sql<TruckRow>`select * from trucks where id = ${data.id} limit 1`;
    const row = rows[0];
    if (!row) return null;
    if (row.status !== "live") {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const user = await getSessionUser();
      if (!user || user.id !== row.owner_user_id) return null;
    }
    const truck = mapTruck(row);
    const stops = (
      await sql<StopRow>`
        select * from stops where truck_id = ${truck.id}
        order by starts_at asc
      `
    ).map(mapStop);
    return { truck, stops };
  });

export const listMeetups = createServerFn({ method: "POST" })
  .validator((input: { lat: number; lng: number; radiusMiles: number }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureDemoCatalog(sql);
    const rows = await sql<{
      id: string;
      name: string;
      description: string | null;
      place_name: string;
      address: string;
      lat: number;
      lng: number;
      starts_at: string;
      ends_at: string;
      status: MeetupListItem["status"];
      join_mode: "open" | "invite";
      max_trucks: number | null;
      cover_tone: string;
      host_truck_id: string;
      host_truck_name: string;
      member_count: number;
    }>`
      select m.*, t.name as host_truck_name,
        (select count(*)::int from meetup_members mm where mm.meetup_id = m.id and mm.rsvp = 'going') as member_count
      from meetups m
      join trucks t on t.id = m.host_truck_id
      where m.status in ('scheduled', 'live')
      order by m.starts_at asc
    `;
    const origin = { lat: data.lat, lng: data.lng };
    const items: MeetupListItem[] = rows
      .map((r) => {
        const lat = Number(r.lat);
        const lng = Number(r.lng);
        return {
          id: r.id,
          name: r.name,
          description: r.description,
          placeName: r.place_name,
          address: r.address,
          lat,
          lng,
          startsAt: typeof r.starts_at === "string" ? r.starts_at : new Date(r.starts_at).toISOString(),
          endsAt: typeof r.ends_at === "string" ? r.ends_at : new Date(r.ends_at).toISOString(),
          status: r.status,
          joinMode: r.join_mode,
          maxTrucks: r.max_trucks,
          coverTone: r.cover_tone,
          hostTruckId: r.host_truck_id,
          hostTruckName: r.host_truck_name,
          memberCount: Number(r.member_count),
          distanceMiles: haversineMiles(origin, { lat, lng }),
        };
      })
      .filter((m) => m.distanceMiles == null || m.distanceMiles <= data.radiusMiles);
    return { items };
  });

export const getMeetup = createServerFn({ method: "POST" })
  .validator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureDemoCatalog(sql);
    const rows = await sql<{
      id: string;
      host_truck_id: string;
      host_user_id: string;
      name: string;
      description: string | null;
      place_name: string;
      address: string;
      lat: number;
      lng: number;
      starts_at: string;
      ends_at: string;
      join_mode: "open" | "invite";
      max_trucks: number | null;
      status: MeetupListItem["status"];
      cover_tone: string;
      host_truck_name: string;
    }>`
      select m.*, t.name as host_truck_name
      from meetups m
      join trucks t on t.id = m.host_truck_id
      where m.id = ${data.id}
      limit 1
    `;
    const m = rows[0];
    if (!m) return null;
    if (m.status === "cancelled") {
      const { getSessionUser } = await import("@/lib/auth/verify.server");
      const user = await getSessionUser();
      if (!user || user.id !== m.host_user_id) return null;
    }
    const members = await sql<{
      meetup_id: string;
      truck_id: string;
      user_id: string;
      role: "host" | "member";
      rsvp: "going" | "left";
      stop_id: string;
      notes: string | null;
      truck_name: string;
      cover_tone: string;
      primary_cuisine: Cuisine;
      stop_status: StopStatus;
    }>`
      select mm.*, tr.name as truck_name, tr.cover_tone, tr.primary_cuisine, s.status as stop_status
      from meetup_members mm
      join trucks tr on tr.id = mm.truck_id
      join stops s on s.id = mm.stop_id
      where mm.meetup_id = ${m.id}
      order by mm.role desc, tr.name asc
    `;
    return {
      meetup: {
        id: m.id,
        name: m.name,
        description: m.description,
        placeName: m.place_name,
        address: m.address,
        lat: Number(m.lat),
        lng: Number(m.lng),
        startsAt: typeof m.starts_at === "string" ? m.starts_at : new Date(m.starts_at).toISOString(),
        endsAt: typeof m.ends_at === "string" ? m.ends_at : new Date(m.ends_at).toISOString(),
        status: m.status,
        joinMode: m.join_mode,
        maxTrucks: m.max_trucks,
        coverTone: m.cover_tone,
        hostTruckId: m.host_truck_id,
        hostUserId: m.host_user_id,
        hostTruckName: m.host_truck_name,
      },
      members: members.map((row) => ({
        truckId: row.truck_id,
        userId: row.user_id,
        role: row.role,
        rsvp: row.rsvp,
        stopId: row.stop_id,
        notes: row.notes,
        truckName: row.truck_name,
        coverTone: row.cover_tone,
        cuisine: row.primary_cuisine,
        stopStatus: row.stop_status,
      })),
    };
  });
