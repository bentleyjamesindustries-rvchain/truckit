import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { AreaBar } from "@/components/area-bar";
import { EmptyState } from "@/components/empty-state";
import { FilterBar } from "@/components/filter-bar";
import { PageHeader } from "@/components/page-header";
import { TruckRow } from "@/components/truck-row";
import { Button } from "@/components/ui/button";
import { useAreaStore } from "@/lib/area-store";
import { listTrucks } from "@/lib/server/catalog";

export const Route = createFileRoute("/list")({ component: ListPage });

function ListPage() {
  const area = useAreaStore((s) => s.area);
  const filters = useAreaStore((s) => s.filters);
  const setRadius = useAreaStore((s) => s.setRadius);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["trucks", area.lat, area.lng, area.radiusMiles, filters],
    queryFn: () =>
      listTrucks({
        data: {
          lat: area.lat,
          lng: area.lng,
          radiusMiles: area.radiusMiles,
          filters,
        },
      }),
    refetchInterval: 20_000,
  });

  const items = data?.items ?? [];

  return (
    <AppShell mode="consumer">
      <PageHeader title="Find trucks" />
      <AreaBar />
      <FilterBar />
      <section className="px-5 pt-4 lg:px-8">
        {isPending ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-[var(--radius-xl)] bg-wash sm:h-64" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            title="Couldn’t load trucks"
            body="Check the connection and try again."
            action={
              <Button variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            }
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="No trucks here yet"
            body={
              area.radiusMiles < 20
                ? "This lot is quiet. Widen the radius or try Downtown, Office park, or Dinner lot."
                : "Nobody’s published a stop in this area. Check back at lunch."
            }
            action={
              area.radiusMiles < 20 ? (
                <Button variant="outline" onClick={() => setRadius(Math.min(25, area.radiusMiles + 7))}>
                  Widen search
                </Button>
              ) : null
            }
          />
        ) : (
          <ul className="list-stagger grid gap-3 sm:grid-cols-2">
            {items.map((t) => (
              <li key={t.id}>
                <TruckRow truck={t} variant="tile" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
