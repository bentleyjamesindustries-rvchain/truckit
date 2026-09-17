-- Truckit schema v1 (core Postgres — no PostGIS; distance is Haversine in app)
-- user_id columns are TEXT to match Better Auth ids.

create table if not exists profiles (
  user_id text primary key,
  role text not null default 'consumer'
    check (role in ('consumer', 'operator', 'admin')),
  display_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists trucks (
  id text primary key,
  owner_user_id text not null,
  name text not null check (char_length(name) between 2 and 40),
  slug text unique,
  status text not null default 'draft'
    check (status in ('draft', 'live', 'paused')),
  primary_cuisine text not null,
  secondary_cuisines jsonb not null default '[]',
  bio text check (bio is null or char_length(bio) <= 280),
  service_city text not null,
  service_region text,
  service_lat double precision,
  service_lng double precision,
  cover_tone text not null default 'ember',
  cover_photo_url text,
  photo_urls jsonb not null default '[]',
  dietary_tags jsonb not null default '[]',
  price_band text check (price_band is null or price_band in ('1', '2', '3')),
  typical_windows jsonb not null default '[]',
  public_phone text,
  phone_public boolean not null default false,
  instagram_url text,
  tiktok_url text,
  website_url text,
  timezone text not null default 'America/New_York',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trucks_status_idx on trucks (status);
create index if not exists trucks_primary_cuisine_idx on trucks (primary_cuisine);
create index if not exists trucks_service_city_idx on trucks (service_city);

create table if not exists meetups (
  id text primary key,
  host_truck_id text not null references trucks (id) on delete restrict,
  host_user_id text not null,
  name text not null check (char_length(name) between 2 and 60),
  description text check (description is null or char_length(description) <= 400),
  place_name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  join_mode text not null default 'open'
    check (join_mode in ('open', 'invite')),
  max_trucks int check (max_trucks is null or max_trucks > 0),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'live', 'cancelled', 'ended')),
  cover_tone text not null default 'harbor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meetups_time_ok check (ends_at > starts_at)
);

create index if not exists meetups_starts_at_idx on meetups (starts_at);
create index if not exists meetups_status_idx on meetups (status);
create index if not exists meetups_host_truck_id_idx on meetups (host_truck_id);

create table if not exists stops (
  id text primary key,
  truck_id text not null references trucks (id) on delete cascade,
  meetup_id text references meetups (id) on delete set null,
  title text check (title is null or char_length(title) <= 60),
  place_name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  place_notes text check (place_notes is null or char_length(place_notes) <= 140),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  recurrence text not null default 'once'
    check (recurrence in ('once', 'weekly')),
  recurrence_until date,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'here', 'delayed', 'closed', 'ended')),
  delay_minutes int check (delay_minutes is null or delay_minutes >= 0),
  closed_reason text check (closed_reason is null or char_length(closed_reason) <= 120),
  live_checked_in_at timestamptz,
  live_lat double precision,
  live_lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stops_time_ok check (ends_at > starts_at)
);

create index if not exists stops_truck_id_idx on stops (truck_id);
create index if not exists stops_meetup_id_idx on stops (meetup_id);
create index if not exists stops_starts_at_idx on stops (starts_at);
create index if not exists stops_status_idx on stops (status);

create unique index if not exists stops_one_live_per_truck
  on stops (truck_id)
  where status in ('here', 'delayed');

create table if not exists meetup_members (
  meetup_id text not null references meetups (id) on delete cascade,
  truck_id text not null references trucks (id) on delete cascade,
  user_id text not null,
  role text not null default 'member'
    check (role in ('host', 'member')),
  rsvp text not null default 'going'
    check (rsvp in ('going', 'left')),
  stop_id text not null references stops (id) on delete cascade,
  notes text check (notes is null or char_length(notes) <= 140),
  joined_at timestamptz not null default now(),
  primary key (meetup_id, truck_id),
  unique (stop_id)
);

create index if not exists meetup_members_truck_id_idx on meetup_members (truck_id);
create index if not exists meetup_members_user_id_idx on meetup_members (user_id);

create table if not exists favorites (
  user_id text not null,
  truck_id text not null references trucks (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, truck_id)
);

create index if not exists favorites_truck_id_idx on favorites (truck_id);
