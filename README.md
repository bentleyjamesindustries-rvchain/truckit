# Truckit

Find food trucks near you. Run your truck’s schedule and meetups from your phone.

**Chase the smoke.**

Soft launch metro: **Syracuse** (Onondaga County, NY). Recruit home is Clay.

## What it is

A mobile-first web app for lunch and dinner lots.

- **Hungry people** land on the **list** (not the map), filter Open now / Lunch, drop to a map, and open truck + lot pages as a guest.
- **Operators** publish one truck, post stops, and tap **We're here**, **Running late**, or **Closed today**. Check-ins show up on the consumer list within about 20 seconds.

Confirmed Syracuse/Clay lots are seeded as **markets** (Great Northern Mall, CNY Regional Market, Everson Fridays, etc.). **No fake trucks** in Open now. Empty copy is locked: **No trucks here yet** / Nobody's checked in or scheduled in Syracuse right now.

Founding Truck badge: first 50 Syracuse operators with a real We're here. Display only — never a sort boost.

## Try it

1. **Find trucks** from the splash — lands on the list, default area Syracuse.
2. If the lot is quiet, that’s honest. Browse **Meetups** for confirmed gatherings.
3. Sign in (Google, X, or email) → Account → switch to **Operator** to onboard a truck and check in.

No payments, ordering, or POS in this version.

## Data

Postgres tables: `profiles`, `trucks`, `stops`, `meetups`, `meetup_members`, `favorites`, `geo_states`, `geo_counties`, `geo_cities`, `markets`.

- `trucks.is_demo` is excluded from Open now forever.
- Distance is Haversine on lat/lng (no PostGIS required in this stack).
- Auth is Google, X, and email/password.
