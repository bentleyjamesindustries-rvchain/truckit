-- Syracuse production: geo cascade, demo honesty, founding badge, confirmed lots.
-- Additive only. Never mix demo trucks into Open now.

alter table trucks add column if not exists is_demo boolean not null default false;
alter table trucks add column if not exists founding_truck boolean not null default false;
alter table trucks add column if not exists service_city_id text;

create index if not exists trucks_is_demo_idx on trucks (is_demo);
create index if not exists trucks_founding_idx on trucks (founding_truck);

create table if not exists geo_states (
  code char(2) primary key,
  name text not null,
  fips char(2)
);

create table if not exists geo_counties (
  id text primary key,
  state_code char(2) not null references geo_states (code),
  name text not null,
  fips char(5),
  unique (state_code, name)
);

create table if not exists geo_cities (
  id text primary key,
  county_id text not null references geo_counties (id),
  state_code char(2) not null references geo_states (code),
  name text not null,
  lat double precision not null,
  lng double precision not null,
  unique (county_id, name)
);

create index if not exists geo_cities_county_idx on geo_cities (county_id);
create index if not exists geo_counties_state_idx on geo_counties (state_code);

alter table stops add column if not exists city_id text;
alter table meetups add column if not exists city_id text;

create table if not exists markets (
  id text primary key,
  name text not null check (char_length(name) between 2 and 80),
  place_name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  city_id text not null references geo_cities (id),
  city_name text not null,
  cadence text not null,
  season text,
  notes text,
  cover_tone text not null default 'harbor',
  window_kind text not null default 'dinner'
    check (window_kind in ('lunch', 'dinner', 'mixed')),
  status text not null default 'confirmed'
    check (status in ('confirmed', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists markets_city_id_idx on markets (city_id);
create index if not exists markets_status_idx on markets (status);
