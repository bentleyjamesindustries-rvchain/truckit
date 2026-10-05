import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, Globe, Instagram, MapPin, Phone } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { StatusPill } from "@/components/status-pill";
import { TruckCover } from "@/components/truck-cover";
import { getTruck } from "@/lib/server/catalog";
import { CUISINE_LABEL, DIETARY_LABEL } from "@/lib/types";
import { formatDay, formatTimeRange, pickNextStop, statusLabel } from "@/lib/time";

export const Route = createFileRoute("/trucks/$id")({ component: TruckDetail });

function TruckDetail() {
  const { id } = Route.useParams();
  const { data, isPending } = useQuery({
    queryKey: ["truck", id],
    queryFn: () => getTruck({ data: { id } }),
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
          title="No trucks here yet"
          body="This truck isn’t live, or the link is stale."
          action={
            <Link to="/list" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
              Back to list
            </Link>
          }
        />
      </AppShell>
    );
  }

  const { truck, stops } = data;
  const upcoming = stops.filter((s) => s.status !== "ended" && s.status !== "closed");
  const next = pickNextStop(upcoming);
  const label = statusLabel(next, truck.timezone);
  const cuisines = [truck.primaryCuisine, ...truck.secondaryCuisines];

  return (
    <AppShell mode="consumer">
      <div className="relative">
        <TruckCover tone={truck.coverTone} className="h-56 w-full lg:h-72" alt="" />
        <Link
          to="/list"
          className="absolute left-4 top-4 grid size-11 place-items-center rounded-full bg-surface/90 text-fg shadow-sm"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </div>
      <div className="px-5 pt-6 lg:px-8">
        <h1 className="font-display text-3xl font-medium tracking-[-0.04em]">{truck.name}</h1>
        {truck.foundingTruck ? (
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Founding Truck</p>
        ) : null}
        <p className="mt-1 text-sm text-muted">
          {cuisines.map((c) => CUISINE_LABEL[c]).join(" · ")}
          {truck.priceBand ? ` · ${"$".repeat(Number(truck.priceBand))}` : ""}
          {` · ${truck.serviceCity}`}
        </p>
        <div className="mt-3">
          <StatusPill kind={label.kind}>{label.text}</StatusPill>
        </div>
        {truck.bio ? <p className="mt-4 text-base leading-relaxed text-fg/90">{truck.bio}</p> : null}
        {truck.dietaryTags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {truck.dietaryTags.map((t) => (
              <span key={t} className="rounded-full bg-wash px-3 py-1 text-xs font-medium text-primary">
                {DIETARY_LABEL[t]}
              </span>
            ))}
          </div>
        ) : null}

        <h2 className="mt-10 text-xs font-medium uppercase tracking-[0.16em] text-muted">Stops</h2>
        <ul className="mt-3 space-y-2">
          {upcoming.length === 0 ? (
            <li className="rounded-[var(--radius-lg)] bg-surface p-4 text-sm text-muted ring-1 ring-border">
              No upcoming stops posted.
            </li>
          ) : (
            upcoming.map((s) => (
              <li key={s.id} className="rounded-[var(--radius-lg)] bg-surface p-4 ring-1 ring-border">
                <p className="font-medium">{s.placeName}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <Clock className="size-3.5" />
                  {formatDay(s.startsAt, truck.timezone)} · {formatTimeRange(s.startsAt, s.endsAt, truck.timezone)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                  <MapPin className="size-3.5" />
                  {s.address}
                </p>
              </li>
            ))
          )}
        </ul>

        <div className="mt-8 flex flex-col gap-2 pb-6 text-sm">
          {truck.phonePublic && truck.publicPhone ? (
            <a href={`tel:${truck.publicPhone}`} className="inline-flex items-center gap-2 text-primary">
              <Phone className="size-4" /> {truck.publicPhone}
            </a>
          ) : null}
          {truck.instagramUrl ? (
            <a href={truck.instagramUrl} className="inline-flex items-center gap-2 text-primary" target="_blank" rel="noreferrer">
              <Instagram className="size-4" /> Instagram
            </a>
          ) : null}
          {truck.websiteUrl ? (
            <a href={truck.websiteUrl} className="inline-flex items-center gap-2 text-primary" target="_blank" rel="noreferrer">
              <Globe className="size-4" /> Website
            </a>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
