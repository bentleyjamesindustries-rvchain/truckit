import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { TruckCover } from "@/components/truck-cover";
import { TruckRow } from "@/components/truck-row";
import { getMarket } from "@/lib/server/catalog";

export const Route = createFileRoute("/lots/$id")({ component: LotPage });

function LotPage() {
  const { id } = Route.useParams();
  const { data, isPending } = useQuery({
    queryKey: ["lot", id],
    queryFn: () => getMarket({ data: { id } }),
    refetchInterval: 20_000,
  });

  if (isPending) {
    return (
      <AppShell mode="consumer">
        <div className="h-56 animate-pulse bg-wash" />
      </AppShell>
    );
  }
  if (!data) {
    return (
      <AppShell mode="consumer">
        <EmptyState
          title="Lot not found"
          body="This gathering isn’t on the board."
          action={
            <Link to="/meetups" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Back to lots
            </Link>
          }
        />
      </AppShell>
    );
  }

  const { market, trucks } = data;
  const live = trucks.filter((t) => t.isOpenNow);

  return (
    <AppShell mode="consumer">
      <PageHeader title={market.name} />
      <div className="relative">
        <TruckCover tone={market.coverTone} className="h-52 w-full lg:h-72" alt="" />
        <Link
          to="/meetups"
          className="absolute left-4 top-4 grid size-11 place-items-center rounded-full bg-surface/90 text-fg shadow-sm"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </div>
      <div className="px-5 pt-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{market.cityName}</p>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-[-0.04em]">{market.name}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-4" />
          {market.address}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-fg/80">
          <Clock className="size-4" />
          {market.cadence}
          {market.season ? ` · ${market.season}` : ""}
        </p>
        {market.notes ? <p className="mt-4 text-base leading-relaxed text-fg/90">{market.notes}</p> : null}

        <aside className="mt-6 rounded-[var(--radius-xl)] bg-primary px-5 py-4 text-primary-fg">
          <p className="font-display text-xl font-medium italic tracking-tight">Find open trucks at this lot.</p>
          <p className="mt-1 text-sm text-primary-fg/75">Operators: park, open Truckit, tap We’re here.</p>
        </aside>

        <h2 className="mt-10 text-sm font-semibold uppercase tracking-[0.14em] text-muted">Open now</h2>
        {live.length === 0 ? (
          <EmptyState
            kicker={market.cityName}
            title="No trucks here yet"
            body={`Nobody's checked in or scheduled in ${market.cityName} right now.`}
          />
        ) : (
          <ul className="mt-3 grid gap-3">
            {live.map((t) => (
              <li key={t.id}>
                <TruckRow truck={t} />
              </li>
            ))}
          </ul>
        )}

        {trucks.length > live.length ? (
          <>
            <h2 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-muted">Scheduled here</h2>
            <ul className="mt-3 grid gap-3 pb-10">
              {trucks
                .filter((t) => !t.isOpenNow)
                .map((t) => (
                  <li key={t.id}>
                    <TruckRow truck={t} />
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <div className="h-8" />
        )}
      </div>
    </AppShell>
  );
}
