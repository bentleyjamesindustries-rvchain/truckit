# TRUCKIT — FULL BUILD BRIEF FOR GROK BUILD
# Paste this entire document into Grok Build as the project instruction.
# Separate from Grok Bot / RV Chain / Rocket Vibes / DOGE. New project only.

---

## WHO YOU ARE
You are building **Truckit**, a mobile-first web app for food trucks and hungry people.
- Operators schedule locations and meetups, check in live ("We're here").
- Consumers find trucks by area for **lunch and dinner** (late night secondary).
Build a complete, working MVP. Do not reuse any RV Chain, Rocket Vibes, or DOGE code, domains, or databases.

## PRODUCT ONE-LINER
Find food trucks near you. Run your truck's schedule and meetups from your phone.

## BRAND (implement in UI)
- Name: **Truckit**
- Hero tagline: **Chase the smoke.**
- Attitude brand; utility for filters/status ("Open now", times, places)
- Operator actions (exact strings): **We're here** · **Running late** · **Closed today**
- Primary markets: daytime **lunch + dinner** lots (office park, downtown lunch, dinner lot). Late night not brand face.
- Palette **Day Lot**:
  - primary `#14532D`
  - accent `#E11D48` (CTAs only)
  - bg `#F8FAFC`
  - live `#16A34A` (status only)
  - surface `#FFFFFF`, border `#E2E8F0`, muted `#64748B`
- Visual: modern SOTA — geometric grotesque type (Inter or similar), generous whitespace, frost tab bars, soft shadows, radius 12 cards / 16 buttons / pill chips
- Logo mark: abstract ember circle + 2 soft stadium smoke plumes left of wordmark — NO cartoon trucks, food glyphs, kraft/chalkboard kitsch
- Motion: live-dot pulse on check-in (≤2 loops); list stagger 8px/220ms; CTA press scale 0.98
- Empty cities: primary copy **No trucks here yet** (optional attitude line above only)

## STACK
- Next.js 15 App Router + TypeScript + Tailwind CSS
- Supabase Auth + Postgres + Storage (brand-new project — document env, never invent real keys)
- Maps: **MapLibre GL + OSM tiles** by default (no API key). Optional Mapbox/Google later via env
- Deploy target: Vercel + Supabase
- No payments, POS, tips, escrow, ordering in MVP

## ENV (.env.local.example)
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAP_PROVIDER=maplibre
# optional later:
# NEXT_PUBLIC_MAPBOX_TOKEN=
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

## SCREENS & ROUTES

### Auth / shared
- A1 Splash `/` — mark+TRUCKIT, Chase the smoke., CTAs **Find trucks** / **I run a truck**, Sign in
- A2–A5 Auth sign-in/up/confirm/reset
- A6 Account — profile, switch Consumer/Operator, sign out

### Consumer (bottom tabs: List · Map · Meetups · Account)
- **C2 List `/list` — MOBILE DEFAULT LANDING** (not Map)
- C1 Map `/map` — secondary tab/toggle
- C3 Filters: Open now · Lunch · Dinner · Cuisine · More (Late, radius)
- C4 Truck detail `/trucks/[id]`
- C5 Pin/preview sheet from map
- C6 Meetups `/meetups` · C7 Meetup detail `/meetups/[id]`
- Guest: List+Map+meetup/truck read-only; deep links work signed-out

### Operator (tabs: Today · Schedule · Meetups · Truck · Account)
- O7 Onboarding — create truck → first stop (Lunch+Dinner typical_windows pre-checked)
- O1 Truck profile `/op/truck`
- O2 Today `/op/today` — You're on + place/window + big We're here
- O3 Schedule · O4 Add/edit stop
- O5–O6 Meetups create/join

## CONSUMER RULES
- Area required (zip / neighborhood / city / optional locate). ~5–10 mi radius; Widen if empty.
- Open now = stop status `here` or `delayed` (primary); scheduled-in-window secondary OK
- Lunch window ~11:00–14:30 local; Dinner ~16:30–21:00; Late after ~21:00 under More only
- List sort: open-now → soonest lunch/dinner stop → other upcoming → name
- List row: Name · cuisine · Status first (Open now | Next at TIME · PLACE) — no witty line where status belongs
- Area examples: Downtown, Office park, Dinner lot
- Empty: **No trucks here yet** + helpful subcopy; never fake trucks
- Locate optional; no background tracking in MVP

## OPERATOR RULES
- Overlapping scheduled stops OK; at most ONE `here`|`delayed` stop per truck
- We're here captures GPS; warn if >200m from planned pin
- Meetup: host edits name/place/time; members edit own notes + live status only
- Host leave = transfer host or cancel
- One truck per account in MVP

## BUILD ORDER
P0 Auth → P1 Consumer List+Map+filters+detail → P2 Operator onboarding+profile+stops+live → P3 Meetups → P4 polish + seed ≥5 trucks one metro → P5 Favorites UI v1.1 (table exists now)

## OUT OF MVP
Payments/POS/ordering · full menu builder · favorites UI/alerts · reviews/DMs · fleet/staff · live GPS breadcrumb · native apps · fake #1 counts · any RV Chain crossover

## DATA MODEL
Apply this SQL as the initial migration (PostGIS required). RLS: enable on all tables; policies: users own-row; trucks public select if live else owner; stops select if truck live or owner, write owner; meetups public non-cancelled or host; meetup_members per join rules; favorites auth.uid only. Expand sketched policies into real CREATE POLICY statements.

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

## ACCEPTANCE GATES
- Mobile cold start opens List not Map
- Sign up / confirm / reset work
- We're here updates consumer status within ~30s
- Lunch/Dinner chips work; Late not default
- Empty area honest
- No payment UI; separate infra only
- `npm install && npm run build` succeeds
- README: create Supabase project, enable PostGIS, run migration, env vars, run seed

## SEED
Include SQL or script with ≥5 trucks + lunch/dinner stops in one fictional metro for demos.

## DONE
Ship a coherent branded MVP matching the above. Prefer working vertical slices over incomplete polish.
