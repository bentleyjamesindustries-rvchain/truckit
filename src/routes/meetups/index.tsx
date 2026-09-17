import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AreaBar } from "@/components/area-bar";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { TruckCover } from "@/components/truck-cover";
import { useAreaStore } from "@/lib/area-store";
import { listMeetups } from "@/lib/server/catalog";
import { formatDay, formatTimeRange } from "@/lib/time";
import { formatMiles } from "@/lib/geo";

export const Route = createFileRoute("/meetups/")({ component: MeetupsPage });

function MeetupsPage() {
  const area = useAreaStore((s) => s.area);
  const { data, isPending } = useQuery({
    queryKey: ["meetups", area.lat, area.lng, area.radiusMiles],
    queryFn: () => listMeetups({ data: { lat: area.lat, lng: area.lng, radiusMiles: area.radiusMiles } }),
  });
  const items = data?.items ?? [];

  return (
    <AppShell mode="consumer">
      <PageHeader title="Meetups" />
      <AreaBar />
      <section className="px-5 pt-4 lg:px-8">
        <h1 className="mb-4 text-xl font-semibold tracking-tight lg:hidden">Meetups</h1>
        {isPending ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-40 animate-pulse rounded-[var(--radius-xl)] bg-wash" />
            <div className="h-40 animate-pulse rounded-[var(--radius-xl)] bg-wash" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="No trucks here yet" body="No meetups posted in this area." />
        ) : (
          <ul className="list-stagger grid gap-3 sm:grid-cols-2">
            {items.map((m) => (
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
        )}
      </section>
    </AppShell>
  );
}
