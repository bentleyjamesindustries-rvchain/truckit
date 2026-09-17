import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { haversineMeters } from "@/lib/geo";
import type { Cuisine, DietaryTag, Truck, WindowKind } from "@/lib/types";
import { mapStop, mapTruck } from "./catalog";
import { ensureDemoCatalog } from "./seed";

async function ensureProfile(
  sql: Awaited<ReturnType<typeof getSql>>,
  userId: string,
  displayName?: string | null,
) {
  await sql`
    insert into profiles (user_id, role, display_name)
    values (${userId}, 'consumer', ${displayName ?? null})
    on conflict (user_id) do nothing
  `;
}

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureDemoCatalog(sql);
    await ensureProfile(sql, context.userId);
    const profiles = await sql<{
      user_id: string;
      role: "consumer" | "operator" | "admin";
      display_name: string | null;
      avatar_url: string | null;
      phone: string | null;
    }>`select * from profiles where user_id = ${context.userId} limit 1`;
    const trucks = await sql<Parameters<typeof mapTruck>[0]>`
      select * from trucks where owner_user_id = ${context.userId} limit 1
    `;
    return {
      profile: profiles[0] ?? {
        user_id: context.userId,
        role: "consumer" as const,
        display_name: null,
        avatar_url: null,
        phone: null,
      },
      truck: trucks[0] ? mapTruck(trucks[0]) : null,
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      displayName?: string;
      role?: "consumer" | "operator";
      phone?: string;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(sql, context.userId, data.displayName);
    await sql`
      update profiles
      set
        display_name = coalesce(${data.displayName ?? null}, display_name),
        role = coalesce(${data.role ?? null}, role),
        phone = coalesce(${data.phone ?? null}, phone),
        updated_at = now()
      where user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const upsertMyTruck = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      name: string;
      primaryCuisine: Cuisine;
      secondaryCuisines?: Cuisine[];
      bio?: string;
      serviceCity: string;
      typicalWindows: WindowKind[];
      dietaryTags?: DietaryTag[];
      priceBand?: "1" | "2" | "3";
      coverTone?: string;
      instagramUrl?: string;
      websiteUrl?: string;
      publicPhone?: string;
      phonePublic?: boolean;
      status?: Truck["status"];
      serviceLat?: number;
      serviceLng?: number;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await ensureProfile(sql, context.userId);
    const existing = await sql<{ id: string }>`
      select id from trucks where owner_user_id = ${context.userId} limit 1
    `;
    const name = data.name.trim();
    if (name.length < 2 || name.length > 40) throw new Error("Name must be 2–40 characters");
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const secondary = JSON.stringify((data.secondaryCuisines ?? []).slice(0, 2));
    const windows = JSON.stringify(data.typicalWindows);
    const tags = JSON.stringify(data.dietaryTags ?? []);
    if (existing[0]) {
      await sql`
        update trucks set
          name = ${name},
          slug = ${slug},
          primary_cuisine = ${data.primaryCuisine},
          secondary_cuisines = ${secondary}::jsonb,
          bio = ${data.bio ?? null},
          service_city = ${data.serviceCity},
          typical_windows = ${windows}::jsonb,
          dietary_tags = ${tags}::jsonb,
          price_band = ${data.priceBand ?? null},
          cover_tone = coalesce(${data.coverTone ?? null}, cover_tone),
          instagram_url = ${data.instagramUrl ?? null},
          website_url = ${data.websiteUrl ?? null},
          public_phone = ${data.publicPhone ?? null},
          phone_public = ${data.phonePublic ?? false},
          status = coalesce(${data.status ?? null}, status),
          service_lat = coalesce(${data.serviceLat ?? null}, service_lat),
          service_lng = coalesce(${data.serviceLng ?? null}, service_lng),
          updated_at = now()
        where id = ${existing[0].id} and owner_user_id = ${context.userId}
      `;
      await sql`update profiles set role = 'operator', updated_at = now() where user_id = ${context.userId}`;
      return { id: existing[0].id };
    }
    const id = crypto.randomUUID();
    await sql`
      insert into trucks (
        id, owner_user_id, name, slug, status, primary_cuisine, secondary_cuisines,
        bio, service_city, cover_tone, dietary_tags, price_band, typical_windows,
        instagram_url, website_url, public_phone, phone_public, service_lat, service_lng
      ) values (
        ${id}, ${context.userId}, ${name}, ${slug}, ${data.status ?? "draft"},
        ${data.primaryCuisine}, ${secondary}::jsonb, ${data.bio ?? null}, ${data.serviceCity},
        ${data.coverTone ?? "ember"}, ${tags}::jsonb, ${data.priceBand ?? null}, ${windows}::jsonb,
        ${data.instagramUrl ?? null}, ${data.websiteUrl ?? null}, ${data.publicPhone ?? null},
        ${data.phonePublic ?? false}, ${data.serviceLat ?? null}, ${data.serviceLng ?? null}
      )
    `;
    await sql`update profiles set role = 'operator', updated_at = now() where user_id = ${context.userId}`;
    return { id };
  });

export const getMyTruckToday = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    await ensureDemoCatalog(sql);
    const trucks = await sql<Parameters<typeof mapTruck>[0]>`
      select * from trucks where owner_user_id = ${context.userId} limit 1
    `;
    if (!trucks[0]) return { truck: null, stops: [] as ReturnType<typeof mapStop>[], live: null };
    const truck = mapTruck(trucks[0]);
    const stops = (
      await sql<Parameters<typeof mapStop>[0]>`
        select * from stops
        where truck_id = ${truck.id}
        order by starts_at asc
      `
    ).map(mapStop);
    const live = stops.find((s) => s.status === "here" || s.status === "delayed") ?? null;
    return { truck, stops, live };
  });

export const upsertStop = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      id?: string;
      title?: string;
      placeName: string;
      address: string;
      lat: number;
      lng: number;
      placeNotes?: string;
      startsAt: string;
      endsAt: string;
      recurrence?: "once" | "weekly";
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const trucks = await sql<{ id: string }>`
      select id from trucks where owner_user_id = ${context.userId} limit 1
    `;
    const truckId = trucks[0]?.id;
    if (!truckId) throw new Error("Create a truck first");
    const starts = new Date(data.startsAt);
    const ends = new Date(data.endsAt);
    if (!(ends.getTime() > starts.getTime())) throw new Error("End must be after start");
    if (ends.getTime() - starts.getTime() > 18 * 3600 * 1000) {
      throw new Error("Stops can last at most 18 hours");
    }
    if (data.id) {
      await sql`
        update stops set
          title = ${data.title ?? null},
          place_name = ${data.placeName},
          address = ${data.address},
          lat = ${data.lat},
          lng = ${data.lng},
          place_notes = ${data.placeNotes ?? null},
          starts_at = ${data.startsAt},
          ends_at = ${data.endsAt},
          recurrence = ${data.recurrence ?? "once"},
          updated_at = now()
        where id = ${data.id} and truck_id = ${truckId}
      `;
      return { id: data.id };
    }
    const id = crypto.randomUUID();
    await sql`
      insert into stops (
        id, truck_id, title, place_name, address, lat, lng, place_notes, starts_at, ends_at, recurrence, status
      ) values (
        ${id}, ${truckId}, ${data.title ?? null}, ${data.placeName}, ${data.address},
        ${data.lat}, ${data.lng}, ${data.placeNotes ?? null}, ${data.startsAt}, ${data.endsAt},
        ${data.recurrence ?? "once"}, 'scheduled'
      )
    `;
    return { id };
  });

export const deleteStop = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      delete from stops s
      using trucks t
      where s.id = ${data.id}
        and s.truck_id = t.id
        and t.owner_user_id = ${context.userId}
        and s.status not in ('here', 'delayed')
    `;
    return { ok: true };
  });

export const checkInHere = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      stopId: string;
      lat?: number | null;
      lng?: number | null;
      force?: boolean;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      truck_id: string;
      lat: number;
      lng: number;
      status: string;
    }>`
      select s.id, s.truck_id, s.lat, s.lng, s.status
      from stops s
      join trucks t on t.id = s.truck_id
      where s.id = ${data.stopId} and t.owner_user_id = ${context.userId}
      limit 1
    `;
    const stop = rows[0];
    if (!stop) throw new Error("Stop not found");
    let warnMeters: number | null = null;
    if (data.lat != null && data.lng != null) {
      const meters = haversineMeters(
        { lat: Number(stop.lat), lng: Number(stop.lng) },
        { lat: data.lat, lng: data.lng },
      );
      if (meters > 200 && !data.force) {
        return { ok: false as const, warnMeters: Math.round(meters) };
      }
      warnMeters = Math.round(meters);
    }
    await sql`
      update stops set status = 'ended', updated_at = now()
      where truck_id = ${stop.truck_id}
        and status in ('here', 'delayed')
        and id <> ${stop.id}
    `;
    await sql`
      update stops set
        status = 'here',
        live_checked_in_at = now(),
        live_lat = ${data.lat ?? Number(stop.lat)},
        live_lng = ${data.lng ?? Number(stop.lng)},
        delay_minutes = null,
        updated_at = now()
      where id = ${stop.id}
    `;
    return { ok: true as const, warnMeters };
  });

export const markRunningLate = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { stopId: string; delayMinutes: number }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update stops s set
        status = 'delayed',
        delay_minutes = ${Math.max(0, data.delayMinutes)},
        updated_at = now()
      from trucks t
      where s.id = ${data.stopId}
        and s.truck_id = t.id
        and t.owner_user_id = ${context.userId}
    `;
    return { ok: true };
  });

export const markClosedToday = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { stopId?: string; reason?: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const trucks = await sql<{ id: string }>`
      select id from trucks where owner_user_id = ${context.userId} limit 1
    `;
    const truckId = trucks[0]?.id;
    if (!truckId) throw new Error("No truck");
    await sql`
      update stops set
        status = 'closed',
        closed_reason = ${data.reason ?? "Closed today"},
        updated_at = now()
      where truck_id = ${truckId}
        and status in ('scheduled', 'here', 'delayed')
        and starts_at < now() + interval '18 hours'
        and ends_at > now() - interval '2 hours'
    `;
    return { ok: true };
  });

export const createMeetup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      name: string;
      description?: string;
      placeName: string;
      address: string;
      lat: number;
      lng: number;
      startsAt: string;
      endsAt: string;
      maxTrucks?: number;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const trucks = await sql<{ id: string }>`
      select id from trucks where owner_user_id = ${context.userId} and status = 'live' limit 1
    `;
    const truckId = trucks[0]?.id;
    if (!truckId) throw new Error("Publish your truck first");
    const id = crypto.randomUUID();
    const stopId = crypto.randomUUID();
    await sql`
      insert into meetups (
        id, host_truck_id, host_user_id, name, description, place_name, address, lat, lng,
        starts_at, ends_at, join_mode, max_trucks, status, cover_tone
      ) values (
        ${id}, ${truckId}, ${context.userId}, ${data.name.trim()}, ${data.description ?? null},
        ${data.placeName}, ${data.address}, ${data.lat}, ${data.lng},
        ${data.startsAt}, ${data.endsAt}, 'open', ${data.maxTrucks ?? null}, 'scheduled', 'harbor'
      )
    `;
    await sql`
      insert into stops (
        id, truck_id, meetup_id, title, place_name, address, lat, lng, starts_at, ends_at, status
      ) values (
        ${stopId}, ${truckId}, ${id}, ${data.name.trim()}, ${data.placeName}, ${data.address},
        ${data.lat}, ${data.lng}, ${data.startsAt}, ${data.endsAt}, 'scheduled'
      )
    `;
    await sql`
      insert into meetup_members (meetup_id, truck_id, user_id, role, rsvp, stop_id)
      values (${id}, ${truckId}, ${context.userId}, 'host', 'going', ${stopId})
    `;
    return { id };
  });

export const joinMeetup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { meetupId: string; notes?: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const trucks = await sql<{ id: string }>`
      select id from trucks where owner_user_id = ${context.userId} and status = 'live' limit 1
    `;
    const truckId = trucks[0]?.id;
    if (!truckId) throw new Error("Publish your truck first");
    const meet = await sql<{
      id: string;
      place_name: string;
      address: string;
      lat: number;
      lng: number;
      starts_at: string;
      ends_at: string;
      join_mode: string;
      max_trucks: number | null;
      status: string;
    }>`select * from meetups where id = ${data.meetupId} limit 1`;
    const m = meet[0];
    if (!m || m.status === "cancelled" || m.status === "ended") throw new Error("Meetup unavailable");
    if (m.join_mode !== "open") throw new Error("This meetup is invite only");
    const count = await sql<{ n: number }>`
      select count(*)::int as n from meetup_members where meetup_id = ${m.id} and rsvp = 'going'
    `;
    if (m.max_trucks && Number(count[0]?.n ?? 0) >= m.max_trucks) throw new Error("Meetup is full");
    const existing = await sql<{ truck_id: string }>`
      select truck_id from meetup_members where meetup_id = ${m.id} and truck_id = ${truckId}
    `;
    if (existing[0]) return { ok: true };
    const stopId = crypto.randomUUID();
    const starts = typeof m.starts_at === "string" ? m.starts_at : new Date(m.starts_at).toISOString();
    const ends = typeof m.ends_at === "string" ? m.ends_at : new Date(m.ends_at).toISOString();
    await sql`
      insert into stops (
        id, truck_id, meetup_id, title, place_name, address, lat, lng, starts_at, ends_at, status, place_notes
      ) values (
        ${stopId}, ${truckId}, ${m.id}, ${"Meetup"}, ${m.place_name}, ${m.address},
        ${m.lat}, ${m.lng}, ${starts}, ${ends}, 'scheduled', ${data.notes ?? null}
      )
    `;
    await sql`
      insert into meetup_members (meetup_id, truck_id, user_id, role, rsvp, stop_id, notes)
      values (${m.id}, ${truckId}, ${context.userId}, 'member', 'going', ${stopId}, ${data.notes ?? null})
    `;
    return { ok: true };
  });

export const leaveMeetup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { meetupId: string; transferToTruckId?: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    const me = await sql<{
      role: string;
      truck_id: string;
      stop_id: string;
    }>`
      select role, truck_id, stop_id from meetup_members
      where meetup_id = ${data.meetupId} and user_id = ${context.userId}
      limit 1
    `;
    const row = me[0];
    if (!row) return { ok: true };
    if (row.role === "host") {
      if (data.transferToTruckId) {
        await sql`
          update meetup_members set role = 'host'
          where meetup_id = ${data.meetupId} and truck_id = ${data.transferToTruckId}
        `;
        await sql`
          update meetups set host_truck_id = ${data.transferToTruckId}, updated_at = now()
          where id = ${data.meetupId} and host_user_id = ${context.userId}
        `;
        const next = await sql<{ user_id: string }>`
          select user_id from meetup_members
          where meetup_id = ${data.meetupId} and truck_id = ${data.transferToTruckId}
        `;
        if (next[0]) {
          await sql`update meetups set host_user_id = ${next[0].user_id} where id = ${data.meetupId}`;
        }
      } else {
        await sql`update meetups set status = 'cancelled', updated_at = now() where id = ${data.meetupId}`;
        await sql`
          update stops set status = 'ended', updated_at = now()
          where meetup_id = ${data.meetupId} and status in ('scheduled', 'here', 'delayed')
        `;
      }
    }
    await sql`
      update meetup_members set rsvp = 'left'
      where meetup_id = ${data.meetupId} and truck_id = ${row.truck_id}
    `;
    await sql`update stops set status = 'ended', updated_at = now() where id = ${row.stop_id}`;
    return { ok: true };
  });

export const updateMeetup = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    (input: {
      id: string;
      name?: string;
      description?: string;
      placeName?: string;
      address?: string;
      lat?: number;
      lng?: number;
      startsAt?: string;
      endsAt?: string;
    }) => input,
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update meetups set
        name = coalesce(${data.name ?? null}, name),
        description = coalesce(${data.description ?? null}, description),
        place_name = coalesce(${data.placeName ?? null}, place_name),
        address = coalesce(${data.address ?? null}, address),
        lat = coalesce(${data.lat ?? null}, lat),
        lng = coalesce(${data.lng ?? null}, lng),
        starts_at = coalesce(${data.startsAt ?? null}, starts_at),
        ends_at = coalesce(${data.endsAt ?? null}, ends_at),
        updated_at = now()
      where id = ${data.id} and host_user_id = ${context.userId}
    `;
    if (data.placeName || data.startsAt || data.lat != null) {
      await sql`
        update stops set
          place_name = coalesce(${data.placeName ?? null}, place_name),
          address = coalesce(${data.address ?? null}, address),
          lat = coalesce(${data.lat ?? null}, lat),
          lng = coalesce(${data.lng ?? null}, lng),
          starts_at = coalesce(${data.startsAt ?? null}, starts_at),
          ends_at = coalesce(${data.endsAt ?? null}, ends_at),
          updated_at = now()
        where meetup_id = ${data.id}
      `;
    }
    return { ok: true };
  });

export const updateMemberNotes = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { meetupId: string; notes: string }) => input)
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`
      update meetup_members set notes = ${data.notes.slice(0, 140)}
      where meetup_id = ${data.meetupId} and user_id = ${context.userId}
    `;
    return { ok: true };
  });
