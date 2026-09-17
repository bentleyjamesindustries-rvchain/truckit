# Truckit

Find food trucks near you. Run your truck’s schedule and meetups from your phone.

**Chase the smoke.**

## What it is

A mobile-first web app for lunch and dinner lots.

- **Hungry people** browse a list (the default), filter Open now / Lunch / Dinner, drop to a map, and open truck + meetup pages as a guest.
- **Operators** publish one truck, post stops, and tap **We're here**, **Running late**, or **Closed today**. Check-ins show up on the consumer list within about 30 seconds.

Demo catalog is seeded in **Westbrook** (Downtown, Office park, Dinner lot). Empty cities stay honest: **No trucks here yet.**

## Try it

1. **Find trucks** from the splash — lands on the list, not the map.
2. Open a live truck (green **Open now**). Toggle Lunch / Dinner chips.
3. Sign in (Google, X, or email) → Account → switch to **Operator** to onboard a truck and check in.

No payments, ordering, or POS in this version.

## Data

Postgres tables: `profiles`, `trucks`, `stops`, `meetups`, `meetup_members`, `favorites` (favorites UI is later). Distance is Haversine on lat/lng. Auth is Google, X, and email/password.
