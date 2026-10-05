import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AreaBar } from "@/components/area-bar";
import { EmptyState } from "@/components/empty-state";
import { LotCard } from "@/components/lot-card";
import { PageHeader } from "@/components/page-header";
import { TruckCover } from "@/components/truck-cover";
import { useAreaStore } from "@/lib/area-store";
import { listMarkets, listMeetups } from "@/lib/server/catalog";
import { formatDay, formatTimeRange } from "@/lib/time";
import { formatMiles } from "@/lib/geo";

export const Route = createFileRoute("/meetups/")({ component: MeetupsPage });

function MeetupsPage() {
  const area = useAreaStore((s) => s.area);
  const lots = useQuery({
    queryKey: ["markets", area.lat, area.lng, area.radiusMiles],
    queryFn: () => listMarkets({ data: { lat: area.lat, lng: area.lng, radiusMiles: area.radiusMiles } }),
  });
  const meetups = useQuery({
    queryKey: ["meetups", area.lat, area.lng, area.radiusMiles],
    queryFn: () => listMeetups({ data: { lat: area.lat, lng: area.lng, radiusMiles: area.radiusMiles } }),
  });
  const lotItems = lots.data?.items ?? [];
  const meetupItems = meetups.data?.items ?? [];
  const pending = lots.isPending && meetups.isPending;

  return (
    <AppShell mode="consumer">
      <PageHeader title="Lots" />
      <AreaBar />
      <section className="px-5 pt-4 lg:px-8">
        <h1 className="mb-1 text-xl font-semibold tracking-tight lg:hidden">Lots</h1>
        <p className="mb-4 text-sm text-muted">Confirmed gatherings. Trucks check in live — no fake pins.</p>
        {pending ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-[var(--radius-xl)] bg-wash" />
            <div className="h-40 animate-pulse rounded-[var(--radius-xl)] bg-wash" />
          </div>
        ) : lotItems.length === 0 && meetupItems.length === 0 ? (
          <EmptyState
            kicker={area.label}
            title="No trucks here yet"
            body={`Nobody's checked in or scheduled in ${area.label} right now.`}
          />
        ) : (
          <>
            {lotItems.length > 0 ? (
              <ul className="list-stagger grid gap-3 sm:grid-cols-2">
                {lotItems.map((lot) => (
                  <li key={lot.id}>
                    <LotCard lot={lot} />
                  </li>
                ))}
              </ul>
            ) : null}
            {meetupItems.length > 0 ? (
              <div className="mt-10">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Operator meetups</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {meetupItems.map((m) => (
                    <li key={m.id}>
                      <Link
                        to="/meetups/$id"
                        params={{ id: m.id }}
                        className="card-lift block overflow-hidden rounded-[var(--radius-xl)] bg-surface shadow-[var(--shadow-card)] ring-1 ring-border"
                      >
                        <TruckCover tone={m.coverTone} className="h-36 w-full" alt="" />
                        <div className="p-4">
                          <h2 className="font-semibold tracking-tight">{m.name}</h2>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                            <MapPin className="size-3.5" />
                            {m.placeName}
                            {m.distanceMiles != null ? ` · ${formatMiles(m.distanceMiles)}` : ""}
                          </p>
                          <p className="mt-1 text-sm text-muted">
                            {formatDay(m.startsAt)} · {formatTimeRange(m.startsAt, m.endsAt)}
                          </p>
                          <p className="mt-2 flex items-center gap-1.5 text-sm text-primary">
                            <Users className="size-3.5" />
                            {m.memberCount} truck{m.memberCount === 1 ? "" : "s"} · Hosted by {m.hostTruckName}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        )}
      </section>
    </AppShell>
  );
}
