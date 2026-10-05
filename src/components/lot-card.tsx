import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { formatMiles } from "@/lib/geo";
import type { MarketListItem } from "@/lib/types";
import { TruckCover } from "./truck-cover";

export function LotCard({ lot }: { lot: MarketListItem }) {
  return (
    <Link
      to="/lots/$id"
      params={{ id: lot.id }}
      className="card-lift block overflow-hidden rounded-[var(--radius-xl)] bg-surface shadow-[var(--shadow-card)] ring-1 ring-border"
    >
      <TruckCover tone={lot.coverTone} className="h-36 w-full" alt="" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold tracking-tight">{lot.name}</h2>
          {lot.liveCount > 0 ? (
            <span className="shrink-0 rounded-full bg-live px-2 py-0.5 text-[11px] font-semibold text-live-fg">
              {lot.liveCount} open
            </span>
          ) : null}
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-3.5" />
          {lot.cityName}
          {lot.distanceMiles != null ? ` · ${formatMiles(lot.distanceMiles)}` : ""}
        </p>
        <p className="mt-1 text-sm text-fg/80">{lot.cadence}</p>
        {lot.season ? <p className="mt-0.5 text-xs text-muted">{lot.season}</p> : null}
      </div>
    </Link>
  );
}
