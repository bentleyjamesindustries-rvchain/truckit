import type { Sql } from "@/lib/db";
import { PLACES } from "@/lib/geo";
import { minutesOfDay, windowOfMinutes } from "@/lib/time";

export const SEED_OWNER = "seed-westbrook";

type SeedTruck = {
  id: string;
  name: string;
  slug: string;
  cuisine: string;
  secondary: string[];
  bio: string;
  tone: string;
  price: "1" | "2" | "3";
  tags: string[];
  windows: string[];
  city: string;
  lat: number;
  lng: number;
};

const TZ = "America/New_York";

const TRUCKS: SeedTruck[] = [
  {
    id: "t-ember-oak",
    name: "Ember & Oak",
    slug: "ember-oak",
    cuisine: "bbq",
    secondary: ["soul_food"],
    bio: "Post-oak brisket, burnt ends, and a vinegar slaw that actually matters.",
    tone: "ember",
    price: "2",
    tags: ["gluten_free"],
    windows: ["lunch", "dinner"],
    city: "Westbrook",
    lat: PLACES.downtown.lat,
    lng: PLACES.downtown.lng,
  },
  {
    id: "t-steel-taco",
    name: "Steel Taco",
    slug: "steel-taco",
    cuisine: "tacos_mexican",
    secondary: [],
    bio: "Griddled tortillas, salsa verde, and a line that moves.",
    tone: "steel",
    price: "1",
    tags: ["vegetarian"],
    windows: ["lunch"],
    city: "Westbrook",
    lat: PLACES.officePark.lat,
    lng: PLACES.officePark.lng,
  },
  {
    id: "t-harbor-slice",
    name: "Harbor Slice",
    slug: "harbor-slice",
    cuisine: "pizza",
    secondary: ["fusion"],
    bio: "Coal-kissed pies, Thursday through Sunday at the river lot.",
    tone: "harbor",
    price: "2",
    tags: ["vegetarian"],
    windows: ["dinner"],
    city: "Westbrook",
    lat: PLACES.dinnerLot.lat,
    lng: PLACES.dinnerLot.lng,
  },
  {
    id: "t-lotus-steam",
    name: "Lotus Steam",
    slug: "lotus-steam",
    cuisine: "asian",
    secondary: ["fusion"],
    bio: "Bao, chili oil, and a steamer that never sits still.",
    tone: "lotus",
    price: "2",
    tags: ["vegan"],
    windows: ["lunch", "dinner"],
    city: "Westbrook",
    lat: PLACES.downtown.lat,
    lng: PLACES.downtown.lng,
  },
  {
    id: "t-green-finch",
    name: "Green Finch",
    slug: "green-finch",
    cuisine: "vegan_veg",
    secondary: ["mediterranean"],
    bio: "Herb-heavy plates from the office-park lunch rotation.",
    tone: "finch",
    price: "2",
    tags: ["vegan", "vegetarian", "gluten_free"],
    windows: ["lunch"],
    city: "Westbrook",
    lat: PLACES.officePark.lat,
    lng: PLACES.officePark.lng,
  },
  {
    id: "t-copper-kettle",
    name: "Copper Kettle",
    slug: "copper-kettle",
    cuisine: "burgers",
    secondary: ["coffee_dessert"],
    bio: "Smash burgers and a soft-serve window after dusk.",
    tone: "copper",
    price: "2",
    tags: [],
    windows: ["dinner", "late_night"],
    city: "Westbrook",
    lat: PLACES.harbor.lat,
    lng: PLACES.harbor.lng,
  },
];

function zonedLocalDate(hour: number, minute: number, dayOffset = 0, timeZone = TZ): Date {
  const cal = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const n = (parts: Intl.DateTimeFormatPart[], type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const utcDay = new Date(Date.UTC(n(cal, "year"), n(cal, "month") - 1, n(cal, "day") + dayOffset));
  const y = utcDay.getUTCFullYear();
  const mo = utcDay.getUTCMonth() + 1;
  const d = utcDay.getUTCDate();
  let utc = Date.UTC(y, mo - 1, d, hour, minute, 0);
  const full = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  });
  const read = (ms: number) => {
    const p = full.formatToParts(new Date(ms));
    return { y: n(p, "year"), mo: n(p, "month"), d: n(p, "day"), h: n(p, "hour"), mi: n(p, "minute") };
  };
  const wanted = Date.UTC(y, mo - 1, d, hour, minute) / 60_000;
  const seen = read(utc);
  const seenMin = Date.UTC(seen.y, seen.mo - 1, seen.d, seen.h, seen.mi) / 60_000;
  utc += (wanted - seenMin) * 60_000;
  return new Date(utc);
}

function isoAt(hour: number, minute: number, dayOffset = 0) {
  return zonedLocalDate(hour, minute, dayOffset).toISOString();
}

type LiveKind = "here" | "delayed" | "scheduled" | "ended";

function windowStatus(startIso: string, endIso: string, live: LiveKind): LiveKind {
  const t = Date.now();
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (t > end + 20 * 60_000) return "ended";
  if (t < start - 90 * 60_000) return "scheduled";
  if (live === "here" || live === "delayed") {
    if (t >= start - 20 * 60_000 && t <= end) return live;
  }
  if (t > end) return "ended";
  return "scheduled";
}

export async function ensureDemoCatalog(sql: Sql): Promise<void> {
  const existing = await sql<{ n: number }>`select count(*)::int as n from trucks`;
  if ((existing[0]?.n ?? 0) === 0) {
    await sql`
      insert into profiles (user_id, role, display_name)
      values (${SEED_OWNER}, 'operator', 'Westbrook Demo Ops')
      on conflict (user_id) do nothing
    `;
    for (const t of TRUCKS) {
      const secondary = JSON.stringify(t.secondary);
      await sql`
        insert into trucks (
          id, owner_user_id, name, slug, status, primary_cuisine, secondary_cuisines,
          bio, service_city, service_region, service_lat, service_lng, cover_tone,
          dietary_tags, price_band, typical_windows, timezone
        ) values (
          ${t.id}, ${SEED_OWNER}, ${t.name}, ${t.slug}, 'live', ${t.cuisine},
          ${secondary}::jsonb, ${t.bio}, ${t.city}, 'NY', ${t.lat}, ${t.lng},
          ${t.tone}, ${JSON.stringify(t.tags)}::jsonb, ${t.price},
          ${JSON.stringify(t.windows)}::jsonb, ${TZ}
        )
        on conflict (id) do nothing
      `;
    }
  }

  const lunchStart = isoAt(11, 15);
  const lunchEnd = isoAt(14, 15);
  const dinnerStart = isoAt(17, 0);
  const dinnerEnd = isoAt(21, 0);
  const lateStart = isoAt(21, 15);
  const lateEnd = isoAt(23, 30);
  const lunchTmrStart = isoAt(11, 15, 1);
  const lunchTmrEnd = isoAt(14, 15, 1);
  const dinnerMeetupStart = isoAt(17, 30);
  const dinnerMeetupEnd = isoAt(21, 0);
  const lunchMeetupStart = isoAt(11, 30, 1);
  const lunchMeetupEnd = isoAt(14, 0, 1);

  const nowWin = windowOfMinutes(minutesOfDay(new Date(), TZ));
  const lunchLive = nowWin === "lunch";
  const dinnerLive = nowWin === "dinner" || nowWin === "afternoon";
  const lateLive = nowWin === "late_night";

  const emberLunch = windowStatus(lunchStart, lunchEnd, lunchLive ? "here" : "scheduled");
  const steelLunch = windowStatus(lunchStart, lunchEnd, lunchLive ? "here" : "scheduled");
  const lotusLunch = windowStatus(lunchStart, lunchEnd, lunchLive ? "here" : "scheduled");
  const finchLunch = windowStatus(lunchStart, lunchEnd, lunchLive ? "delayed" : "scheduled");
  const emberDinner = windowStatus(dinnerStart, dinnerEnd, dinnerLive ? "here" : "scheduled");
  const lotusDinner = windowStatus(dinnerStart, dinnerEnd, dinnerLive ? "here" : "scheduled");
  const harborDinner = windowStatus(dinnerStart, dinnerEnd, dinnerLive ? "here" : "scheduled");
  const copperDinner = windowStatus(dinnerStart, dinnerEnd, dinnerLive ? "here" : "scheduled");
  const copperLate = windowStatus(lateStart, lateEnd, lateLive ? "here" : "scheduled");

  const already = await sql<{ starts_at: string }>`
    select starts_at from stops where id = 's-ember-lunch' limit 1
  `;
  const sameDay =
    already[0] &&
    Math.abs(new Date(already[0].starts_at).getTime() - new Date(lunchStart).getTime()) < 120_000;

  const liveRows: { id: string; status: LiveKind; delay: number | null; lat: number | null; lng: number | null }[] = [
    { id: "s-ember-lunch", status: emberLunch, delay: null, lat: PLACES.downtown.lat, lng: PLACES.downtown.lng },
    { id: "s-steel-lunch", status: steelLunch, delay: null, lat: PLACES.officePark.lat, lng: PLACES.officePark.lng },
    { id: "s-lotus-lunch", status: lotusLunch, delay: null, lat: PLACES.downtown.lat + 0.0012, lng: PLACES.downtown.lng - 0.0008 },
    { id: "s-finch-lunch", status: finchLunch, delay: finchLunch === "delayed" ? 15 : null, lat: PLACES.officePark.lat, lng: PLACES.officePark.lng },
    { id: "s-ember-dinner", status: emberDinner, delay: null, lat: PLACES.downtown.lat, lng: PLACES.downtown.lng },
    { id: "s-lotus-dinner", status: lotusDinner, delay: null, lat: PLACES.dinnerLot.lat, lng: PLACES.dinnerLot.lng },
    { id: "s-harbor-dinner", status: harborDinner, delay: null, lat: PLACES.dinnerLot.lat, lng: PLACES.dinnerLot.lng },
    { id: "s-copper-dinner", status: copperDinner, delay: null, lat: PLACES.harbor.lat, lng: PLACES.harbor.lng },
    { id: "s-copper-late", status: copperLate, delay: null, lat: PLACES.harbor.lat, lng: PLACES.harbor.lng },
  ];

  if (sameDay) {
    await sql`
      update stops
      set status = case when ends_at < now() then 'ended' else 'scheduled' end,
          delay_minutes = null,
          live_checked_in_at = null,
          live_lat = null,
          live_lng = null
      where id like 's-%' and status in ('here', 'delayed', 'scheduled', 'ended')
    `;
    for (const row of liveRows) {
      const isLive = row.status === "here" || row.status === "delayed";
      await sql`
        update stops set
          status = ${row.status},
          delay_minutes = ${row.delay},
          live_checked_in_at = ${isLive ? new Date().toISOString() : null},
          live_lat = ${isLive ? row.lat : null},
          live_lng = ${isLive ? row.lng : null}
        where id = ${row.id}
      `;
    }
    return;
  }

  await sql`delete from meetup_members where meetup_id like 'm-%'`;
  await sql`delete from stops where id like 's-%'`;
  await sql`delete from meetups where id like 'm-%'`;

  await sql`
    insert into stops (
      id, truck_id, title, place_name, address, lat, lng, starts_at, ends_at, status,
      delay_minutes, live_checked_in_at, live_lat, live_lng
    ) values
      ('s-ember-lunch', 't-ember-oak', 'Lunch lot', ${PLACES.downtown.name}, ${PLACES.downtown.address},
        ${PLACES.downtown.lat}, ${PLACES.downtown.lng}, ${lunchStart}, ${lunchEnd}, ${emberLunch},
        null, ${emberLunch === "here" ? new Date().toISOString() : null},
        ${emberLunch === "here" ? PLACES.downtown.lat : null}, ${emberLunch === "here" ? PLACES.downtown.lng : null}),
      ('s-steel-lunch', 't-steel-taco', 'Office lunch', ${PLACES.officePark.name}, ${PLACES.officePark.address},
        ${PLACES.officePark.lat}, ${PLACES.officePark.lng}, ${lunchStart}, ${lunchEnd}, ${steelLunch},
        null, ${steelLunch === "here" ? new Date().toISOString() : null},
        ${steelLunch === "here" ? PLACES.officePark.lat : null}, ${steelLunch === "here" ? PLACES.officePark.lng : null}),
      ('s-lotus-lunch', 't-lotus-steam', 'Court Square', ${PLACES.downtown.name}, ${PLACES.downtown.address},
        ${PLACES.downtown.lat + 0.0012}, ${PLACES.downtown.lng - 0.0008}, ${lunchStart}, ${lunchEnd}, ${lotusLunch},
        null, ${lotusLunch === "here" ? new Date().toISOString() : null},
        ${lotusLunch === "here" ? PLACES.downtown.lat + 0.0012 : null}, ${lotusLunch === "here" ? PLACES.downtown.lng - 0.0008 : null}),
      ('s-finch-lunch', 't-green-finch', 'North Campus', ${PLACES.officePark.name}, ${PLACES.officePark.address},
        ${PLACES.officePark.lat}, ${PLACES.officePark.lng}, ${lunchStart}, ${lunchEnd}, ${finchLunch},
        ${finchLunch === "delayed" ? 15 : null}, ${finchLunch === "delayed" ? new Date().toISOString() : null},
        ${finchLunch === "delayed" ? PLACES.officePark.lat : null}, ${finchLunch === "delayed" ? PLACES.officePark.lng : null}),
      ('s-ember-dinner', 't-ember-oak', 'Dinner lot', ${PLACES.downtown.name}, ${PLACES.downtown.address},
        ${PLACES.downtown.lat}, ${PLACES.downtown.lng}, ${dinnerStart}, ${dinnerEnd}, ${emberDinner},
        null, ${emberDinner === "here" ? new Date().toISOString() : null},
        ${emberDinner === "here" ? PLACES.downtown.lat : null}, ${emberDinner === "here" ? PLACES.downtown.lng : null}),
      ('s-lotus-dinner', 't-lotus-steam', 'River evening', ${PLACES.dinnerLot.name}, ${PLACES.dinnerLot.address},
        ${PLACES.dinnerLot.lat + 0.0006}, ${PLACES.dinnerLot.lng + 0.0004}, ${dinnerStart}, ${dinnerEnd}, ${lotusDinner},
        null, ${lotusDinner === "here" ? new Date().toISOString() : null},
        ${lotusDinner === "here" ? PLACES.dinnerLot.lat : null}, ${lotusDinner === "here" ? PLACES.dinnerLot.lng : null}),
      ('s-harbor-dinner', 't-harbor-slice', 'Riverfront', ${PLACES.dinnerLot.name}, ${PLACES.dinnerLot.address},
        ${PLACES.dinnerLot.lat}, ${PLACES.dinnerLot.lng}, ${dinnerStart}, ${dinnerEnd}, ${harborDinner},
        null, ${harborDinner === "here" ? new Date().toISOString() : null},
        ${harborDinner === "here" ? PLACES.dinnerLot.lat : null}, ${harborDinner === "here" ? PLACES.dinnerLot.lng : null}),
      ('s-copper-dinner', 't-copper-kettle', 'Harbor window', ${PLACES.harbor.name}, ${PLACES.harbor.address},
        ${PLACES.harbor.lat}, ${PLACES.harbor.lng}, ${dinnerStart}, ${dinnerEnd}, ${copperDinner},
        null, ${copperDinner === "here" ? new Date().toISOString() : null},
        ${copperDinner === "here" ? PLACES.harbor.lat : null}, ${copperDinner === "here" ? PLACES.harbor.lng : null}),
      ('s-copper-late', 't-copper-kettle', 'Late window', ${PLACES.harbor.name}, ${PLACES.harbor.address},
        ${PLACES.harbor.lat}, ${PLACES.harbor.lng}, ${lateStart}, ${lateEnd}, ${copperLate},
        null, ${copperLate === "here" ? new Date().toISOString() : null},
        ${copperLate === "here" ? PLACES.harbor.lat : null}, ${copperLate === "here" ? PLACES.harbor.lng : null}),
      ('s-steel-tmr', 't-steel-taco', 'Office lunch', ${PLACES.officePark.name}, ${PLACES.officePark.address},
        ${PLACES.officePark.lat}, ${PLACES.officePark.lng}, ${lunchTmrStart}, ${lunchTmrEnd}, 'scheduled',
        null, null, null, null),
      ('s-finch-tmr', 't-green-finch', 'North Campus', ${PLACES.officePark.name}, ${PLACES.officePark.address},
        ${PLACES.officePark.lat}, ${PLACES.officePark.lng}, ${lunchTmrStart}, ${lunchTmrEnd}, 'scheduled',
        null, null, null, null)
  `;

  await sql`
    insert into meetups (
      id, host_truck_id, host_user_id, name, description, place_name, address, lat, lng,
      starts_at, ends_at, join_mode, max_trucks, status, cover_tone
    ) values
      ('m-dinner-lot', 't-harbor-slice', ${SEED_OWNER}, 'Riverfront Dinner Lot',
        'A standing Thursday dinner cluster by the river. Bring a generator and a line.',
        ${PLACES.dinnerLot.name}, ${PLACES.dinnerLot.address}, ${PLACES.dinnerLot.lat}, ${PLACES.dinnerLot.lng},
        ${dinnerMeetupStart}, ${dinnerMeetupEnd}, 'open', 8, 'scheduled', 'harbor'),
      ('m-office-lunch', 't-steel-taco', ${SEED_OWNER}, 'North Campus Lunch',
        'Friday office-park rotation. Quiet generators, fast service.',
        ${PLACES.officePark.name}, ${PLACES.officePark.address}, ${PLACES.officePark.lat}, ${PLACES.officePark.lng},
        ${lunchMeetupStart}, ${lunchMeetupEnd}, 'open', 6, 'scheduled', 'steel')
  `;

  await sql`update stops set meetup_id = 'm-dinner-lot' where id in ('s-harbor-dinner', 's-copper-dinner')`;

  await sql`
    insert into meetup_members (meetup_id, truck_id, user_id, role, rsvp, stop_id)
    values
      ('m-dinner-lot', 't-harbor-slice', ${SEED_OWNER}, 'host', 'going', 's-harbor-dinner'),
      ('m-dinner-lot', 't-copper-kettle', ${SEED_OWNER}, 'member', 'going', 's-copper-dinner')
  `;

  await sql`
    insert into stops (
      id, truck_id, meetup_id, title, place_name, address, lat, lng, starts_at, ends_at, status
    ) values (
      's-steel-meetup', 't-steel-taco', 'm-office-lunch', 'Meetup', ${PLACES.officePark.name},
      ${PLACES.officePark.address}, ${PLACES.officePark.lat}, ${PLACES.officePark.lng},
      ${lunchMeetupStart}, ${lunchMeetupEnd}, 'scheduled'
    )
  `;
  await sql`
    insert into meetup_members (meetup_id, truck_id, user_id, role, rsvp, stop_id)
    values ('m-office-lunch', 't-steel-taco', ${SEED_OWNER}, 'host', 'going', 's-steel-meetup')
  `;
}
