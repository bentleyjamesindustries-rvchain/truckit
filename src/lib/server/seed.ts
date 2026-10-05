import type { Sql } from "@/lib/db";
import { GEO_CITIES, GEO_COUNTIES, GEO_STATES, LOTS } from "@/lib/geo";

/** Seed geo + confirmed Syracuse lots. Never invent live trucks. */
export async function ensureCatalog(sql: Sql): Promise<void> {
  for (const s of GEO_STATES) {
    await sql`
      insert into geo_states (code, name, fips)
      values (${s.code}, ${s.name}, ${s.fips})
      on conflict (code) do update set name = excluded.name
    `;
  }
  for (const c of GEO_COUNTIES) {
    await sql`
      insert into geo_counties (id, state_code, name, fips)
      values (${c.id}, ${c.stateCode}, ${c.name}, ${c.fips})
      on conflict (id) do update set name = excluded.name
    `;
  }
  for (const city of GEO_CITIES) {
    await sql`
      insert into geo_cities (id, county_id, state_code, name, lat, lng)
      values (${city.id}, ${city.countyId}, ${city.stateCode}, ${city.name}, ${city.lat}, ${city.lng})
      on conflict (id) do update set lat = excluded.lat, lng = excluded.lng, name = excluded.name
    `;
  }

  for (const lot of LOTS) {
    await sql`
      insert into markets (
        id, name, place_name, address, lat, lng, city_id, city_name,
        cadence, season, notes, cover_tone, window_kind, status
      ) values (
        ${lot.id}, ${lot.name}, ${lot.name}, ${lot.address}, ${lot.lat}, ${lot.lng},
        ${lot.cityId}, ${lot.cityName}, ${lot.cadence}, ${lot.season}, ${lot.notes},
        ${lot.coverTone}, ${lot.windowKind}, 'confirmed'
      )
      on conflict (id) do update set
        name = excluded.name,
        place_name = excluded.place_name,
        address = excluded.address,
        lat = excluded.lat,
        lng = excluded.lng,
        cadence = excluded.cadence,
        season = excluded.season,
        notes = excluded.notes,
        cover_tone = excluded.cover_tone,
        window_kind = excluded.window_kind,
        updated_at = now()
    `;
  }

  await sql`
    update trucks
    set is_demo = true, status = 'paused', updated_at = now()
    where owner_user_id = 'seed-westbrook' or is_demo = true
  `;
  await sql`
    update stops
    set status = 'ended', live_checked_in_at = null, live_lat = null, live_lng = null, updated_at = now()
    where truck_id in (select id from trucks where is_demo = true)
      and status in ('here', 'delayed', 'scheduled')
  `;
  await sql`delete from meetup_members where meetup_id like 'm-%'`;
  await sql`delete from meetups where id like 'm-%'`;
}

/** @deprecated use ensureCatalog */
export const ensureDemoCatalog = ensureCatalog;
