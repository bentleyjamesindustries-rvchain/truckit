# TRUCKIT — GROK BUILD BRIEF (SYRACUSE PRODUCTION)
# Paste this ENTIRE document into Grok Build.
# Separate from RV Chain / Rocket Vibes / DOGE. New project only. REAL DATA ONLY.

---

## WHO YOU ARE
Build **Truckit**: mobile-first web app for food trucks and diners.
Operators schedule stops/meetups and tap **We're here**.
Consumers find who's open for **lunch and dinner**.
You are NOT building Food Truck Vibes. You are building a one-thumb lot phone.

## REFUSALS (non-negotiable)
- No map-as-home (List is mobile default)
- No payments / POS / tips / ordering / escrow
- No cute empty cities (no fake busy UI)
- No fleet / staff theater
- No candle-shop rename — name is **Truckit**
- No Westbrook or any demo trucks mixed into Open now
- No Founding Truck ranking boost (badge display only)
- Never reuse RV Chain Supabase `vesmztudzclcptzzaphg`

## BRAND
- Name: **Truckit**
- Hero: **Chase the smoke.**
- Palette Day Lot: primary `#14532D` · accent `#E11D48` (CTAs only) · bg `#F8FAFC` · live `#16A34A` · surface `#FFFFFF` · border `#E2E8F0` · muted `#64748B`
- Mark: abstract ember + 2 smoke plumes — no cartoon truck
- Type: geometric grotesque (Inter ok)
- Operator actions EXACT: **We're here** · **Running late** · **Closed today**

## LAUNCH METRO (SOFT LAUNCH)
- Area chip default: **Syracuse** (Onondaga County, NY)
- Recruit home: Clay, NY (not the area chip label)
- Density model: ~3 real trucks sharing one meetup clock > 20 logos
- First-screen chips at noon: **Open now** + **Lunch** only (Dinner/Cuisine under More)
- Win screenshot: List row with real Open now — not a pretty empty map
- Empty copy: Title **No trucks here yet** · Body **Nobody's checked in or scheduled in Syracuse right now.**
- Flyer (6 words): **Find open trucks at this lot.**
- Op 4:50pm text: **Parked? Open Truckit → tap We're here. Diners see you now.**

## FLAGSHIP REAL LOTS (seed markets — not fake trucks)
Confirmed gatherings to seed as markets/meetup placeholders or stop venues (Confirmed only):
1. Clay — Great Northern Mall Wed 4–8pm (~20–25 trucks) Apr 15–Oct 14 2026
2. Syracuse — CNY Regional Market A-Shed Thu 4–8pm (#SYRFoodTrucks) May–Oct 2026
3. Mattydale — Northern Lights Plaza Tue 4–8pm summer
4. Syracuse — Everson Food Truck Fridays lunch 11–2
5. Syracuse — Upstate Medical weekday lunch (calendar-based)
Also: Harvey's Garden; Traditions East Syracuse Wed concerts; CNY Market weekend 1–2 trucks

Do NOT invent truck accounts for these lots. Seed geo + optional market rows. Demo trucks only if flagged `is_demo=true` AND excluded from Open now forever. Prefer zero demos in soft launch — honest empty until real operators.

## STACK
- Next.js 15 App Router + TypeScript + Tailwind
- NEW Supabase (Auth + Postgres + Storage + PostGIS)
- MapLibre GL + OSM (no Mapbox key required)
- Vercel Hobby
- Email auth only (no SMS MFA)

## ENV (.env.local.example)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAP_PROVIDER=maplibre
NEXT_PUBLIC_DEFAULT_STATE=NY
NEXT_PUBLIC_DEFAULT_CITY_NAME=Syracuse
```

## GEO UX (all states)
Cascading pickers: **State → County → City** (required). City gates search.
Default: NY → Onondaga → Syracuse.
Optional locate prefills cascade. Zip secondary under More.
Add tables: `geo_states`, `geo_counties`, `geo_cities` (FIPS on refs).
`trucks.service_city_id` → geo_cities; `stops.city_id` / `meetups.city_id` → geo_cities.
Seed NY cities that appear in Research; Syracuse first.

## SCREENS
### Splash `/`
TRUCKIT + Chase the smoke. · Find trucks · I run a truck · Sign in

### Consumer tabs: List · Map · Meetups · Account
- **C2 List `/list` — MOBILE DEFAULT**
- C1 Map secondary
- Filters first paint: Open now · Lunch — More holds Dinner, Cuisine, Late, radius
- C4 Truck detail
- C6/C7 Meetups (can be thin week-1)

### Operator tabs: Today · Schedule · Meetups · Truck · Account
- O7 Onboarding (Lunch+Dinner typical_windows pre-checked)
- O1 Truck profile
- O2 Today — You're on + big We're here
- O3/O4 Schedule + stop editor
- Founding Truck badge display if founding_truck (no sort weight)

## CONSUMER RULES
- Open now = stop.status in (`here`,`delayed`) AND truck.status=`live` AND truck.is_demo=false
- Prefer SQL view `open_now_stops` so UI cannot forget filters
- List sort: open-now → soonest lunch/dinner → name
- Lunch ~11:00–14:30 · Dinner ~16:30–21:00 local
- Never show Unverified Research as open-now trucks

## OPERATOR RULES
- Overlapping scheduled OK; at most one here|delayed per truck
- We're here captures GPS; warn if >200m off plan
- Meetup host edits place/time; members notes+live only

## BUILD ORDER (14-day cut)
1. Schema (below + geo_* + is_demo + founding_truck) + Auth
2. Geo cascade seeded + Syracuse default
3. Consumer List + Open now/Lunch + truck detail
4. Operator onboarding + stop + We're here / Running late / Closed today
5. Seed geo + confirmed Syracuse/Clay market rows (no fake trucks)
6. Phone QA + Vercel

Defer: Meetups polish, favorites UI, map polish, photo Storage pipeline, multi-metro marketing.

## FOUNDING TRUCK
- Boolean/badge on truck: first 50 Syracuse operators with ≥1 real We're here
- Display only — NEVER affect Open now sort

## COST ASSUMPTIONS
Target free stack; domain optional. No Twilio.

## SCHEMA v1 (apply as initial migration; then add geo delta)
```sql
-- Truckit schema v1 — Engineer SoT aligned to Operator fields (2026-09-15)
-- NEW Supabase project only. NEVER vesmztudzclcptzzaphg.
-- Map default: MapLibre + OSM (no token). Mapbox/Google optional later.

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- enums
create type public.user_role as enum ('consumer', 'operator', 'admin');

create type public.truck_status as enum ('draft', 'live', 'paused');

create type public.cuisine_enum as enum (
  'bbq', 'burgers', 'tacos_mexican', 'pizza', 'seafood', 'asian', 'indian',
  'mediterranean', 'soul_food', 'coffee_dessert', 'breakfast', 'vegan_veg',
  'fusion', 'other'
);

create type public.dietary_tag as enum (
  'vegetarian', 'vegan', 'gluten_free', 'halal', 'kosher', 'nut_free'
);

create type public.price_band as enum ('1', '2', '3');

create type public.typical_window as enum (
  'breakfast', 'lunch', 'dinner', 'late_night'
);

create type public.stop_status as enum (
  'scheduled', 'here', 'delayed', 'closed', 'ended'
);

create type public.stop_recurrence as enum ('once', 'weekly');

create type public.meetup_status as enum (
  'scheduled', 'live', 'cancelled', 'ended'
);

create type public.meetup_join_mode as enum ('open', 'invite');

create type public.meetup_member_role as enum ('host', 'member');

create type public.meetup_rsvp as enum ('going', 'left');

-- profiles (1:1 auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'consumer',
  display_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trucks
create table public.trucks (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 40),
  slug text unique,
  status public.truck_status not null default 'draft',
  primary_cuisine public.cuisine_enum not null,
  secondary_cuisines public.cuisine_enum[] not null default '{}',
  bio text check (bio is null or char_length(bio) <= 280),
  service_city text not null,
  service_region text,
  service_lat double precision,
  service_lng double precision,
  cover_photo_url text,
  photo_urls text[] not null default '{}',
  dietary_tags public.dietary_tag[] not null default '{}',
  price_band public.price_band,
  typical_windows public.typical_window[] not null default '{}',
  public_phone text,
  phone_public boolean not null default false,
  instagram_url text,
  tiktok_url text,
  website_url text,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trucks_secondary_cuisines_max check (cardinality(secondary_cuisines) <= 2),
  constraint trucks_photo_urls_max check (cardinality(photo_urls) <= 6)
);

create index trucks_owner_user_id_idx on public.trucks (owner_user_id);
create index trucks_status_idx on public.trucks (status);
create index trucks_primary_cuisine_idx on public.trucks (primary_cuisine);
create index trucks_secondary_cuisines_gin on public.trucks using gin (secondary_cuisines);
create index trucks_dietary_tags_gin on public.trucks using gin (dietary_tags);
create index trucks_service_city_idx on public.trucks (service_city);

-- meetups (before stops so stops.meetup_id can FK)
create table public.meetups (
  id uuid primary key default gen_random_uuid(),
  host_truck_id uuid not null references public.trucks (id) on delete restrict,
  host_user_id uuid not null references public.users (id) on delete restrict,
  name text not null check (char_length(name) between 2 and 60),
  description text check (description is null or char_length(description) <= 400),
  place_name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  location geography (Point, 4326)
    generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  join_mode public.meetup_join_mode not null default 'open',
  max_trucks int check (max_trucks is null or max_trucks > 0),
  status public.meetup_status not null default 'scheduled',
  cover_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meetups_time_ok check (ends_at > starts_at)
);

create index meetups_starts_at_idx on public.meetups (starts_at);
create index meetups_status_idx on public.meetups (status);
create index meetups_host_truck_id_idx on public.meetups (host_truck_id);
create index meetups_location_gist on public.meetups using gist (location);

-- stops
create table public.stops (
  id uuid primary key default gen_random_uuid(),
  truck_id uuid not null references public.trucks (id) on delete cascade,
  meetup_id uuid references public.meetups (id) on delete set null,
  title text check (title is null or char_length(title) <= 60),
  place_name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  location geography (Point, 4326)
    generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  place_notes text check (place_notes is null or char_length(place_notes) <= 140),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  recurrence public.stop_recurrence not null default 'once',
  recurrence_until date,
  status public.stop_status not null default 'scheduled',
  delay_minutes int check (delay_minutes is null or delay_minutes >= 0),
  closed_reason text check (closed_reason is null or char_length(closed_reason) <= 120),
  live_checked_in_at timestamptz,
  live_lat double precision,
  live_lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stops_time_ok check (ends_at > starts_at),
  constraint stops_window_max check (ends_at <= starts_at + interval '18 hours'),
  constraint stops_weekly_until check (
    recurrence = 'once' or recurrence_until is not null or recurrence_until is null
  )
);

create index stops_truck_id_idx on public.stops (truck_id);
create index stops_meetup_id_idx on public.stops (meetup_id);
create index stops_starts_at_idx on public.stops (starts_at);
create index stops_status_idx on public.stops (status);
create index stops_location_gist on public.stops using gist (location);
create index stops_open_window_idx on public.stops (starts_at, ends_at)
  where status in ('scheduled', 'here', 'delayed');

-- at most one here|delayed stop per truck
create unique index stops_one_live_per_truck
  on public.stops (truck_id)
  where status in ('here', 'delayed');

-- meetup_members (replaces v0 meetup_trucks)
create table public.meetup_members (
  meetup_id uuid not null references public.meetups (id) on delete cascade,
  truck_id uuid not null references public.trucks (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role public.meetup_member_role not null default 'member',
  rsvp public.meetup_rsvp not null default 'going',
  stop_id uuid not null references public.stops (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (meetup_id, truck_id),
  unique (stop_id)
);

create index meetup_members_truck_id_idx on public.meetup_members (truck_id);
create index meetup_members_user_id_idx on public.meetup_members (user_id);

-- favorites (table yes; UI v1.1)
create table public.favorites (
  user_id uuid not null references public.users (id) on delete cascade,
  truck_id uuid not null references public.trucks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, truck_id)
);

create index favorites_truck_id_idx on public.favorites (truck_id);

-- helpers
create or replace function public.is_truck_owner (tid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.trucks t
    where t.id = tid and t.owner_user_id = auth.uid()
  );
$$;

create or replace function public.is_meetup_host (mid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.meetups m
    where m.id = mid and m.host_user_id = auth.uid()
  );
$$;

-- RLS enable
alter table public.users enable row level security;
alter table public.trucks enable row level security;
alter table public.stops enable row level security;
alter table public.meetups enable row level security;
alter table public.meetup_members enable row level security;
alter table public.favorites enable row level security;

-- RLS one-liners (policies sketched; expand in migration apply)
-- users: select own; insert/update only id = auth.uid()
-- trucks: select if status = 'live' (anon+auth) OR owner; write only owner
-- stops: select if parent truck live OR owner; write if is_truck_owner(truck_id)
--         (meetup-linked: place/time writes host-only — enforce in API/RPC)
-- meetups: select if status in (scheduled,live,ended) OR host; write host
-- meetup_members: select if meetup visible; insert join if open+under cap;
--                 update own rsvp / host manage; delete host or self-leave
-- favorites: all ops only user_id = auth.uid()

-- Consumer open-now = stop.status in ('here','delayed')
--   OR (status = 'scheduled' AND now() between starts_at and ends_at) — product may prefer here/delayed only
-- List sort: open-now → soonest stop → name (app query, not DB constraint)

```

### Schema delta (add after v1)
```sql
-- Demo / founding
alter table public.trucks add column if not exists is_demo boolean not null default false;
alter table public.trucks add column if not exists founding_truck boolean not null default false;

-- Geo refs
create table if not exists public.geo_states (
  code char(2) primary key,
  name text not null,
  fips char(2)
);
create table if not exists public.geo_counties (
  id uuid primary key default gen_random_uuid(),
  state_code char(2) not null references public.geo_states(code),
  name text not null,
  fips char(5) unique,
  unique (state_code, name)
);
create table if not exists public.geo_cities (
  id uuid primary key default gen_random_uuid(),
  county_id uuid not null references public.geo_counties(id),
  state_code char(2) not null references public.geo_states(code),
  name text not null,
  lat double precision,
  lng double precision,
  unique (county_id, name)
);
alter table public.trucks add column if not exists service_city_id uuid references public.geo_cities(id);
alter table public.stops add column if not exists city_id uuid references public.geo_cities(id);
alter table public.meetups add column if not exists city_id uuid references public.geo_cities(id);

-- Open now honesty view
create or replace view public.open_now_stops as
select s.*
from public.stops s
join public.trucks t on t.id = s.truck_id
where s.status in ('here','delayed')
  and t.status = 'live'
  and t.is_demo = false;
```

## ACCEPTANCE
- Mobile cold start → List not Map
- Default area Syracuse
- Open now never includes is_demo or Unverified
- We're here updates list
- Empty Syracuse uses locked copy
- No payment UI
- npm run build succeeds
- README: new Supabase, PostGIS, migrations, env, seed geo

## DONE
A Syracuse-truth soft launch: real operators, real lots, List-first, Chase the smoke., Day Lot. Baddest lot phone — not a Vibes clone.
