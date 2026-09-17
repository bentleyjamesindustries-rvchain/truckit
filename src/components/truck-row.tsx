import { Link } from "@tanstack/react-router";
import { formatMiles } from "@/lib/geo";
import { CUISINE_LABEL } from "@/lib/types";
import type { TruckListItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { StatusPill } from "./status-pill";
import { TruckCover } from "./truck-cover";

export function TruckRow({
  truck,
  variant = "row",
}: {
  truck: TruckListItem;
  variant?: "row" | "tile";
}) {
  const tile = variant === "tile";
  return (
    <Link
      to="/trucks/$id"
      params={{ id: truck.id }}
      className={cn(
        "card-lift overflow-hidden bg-surface shadow-[var(--shadow-card)] ring-1 ring-border",
        tile ? "block rounded-[var(--radius-xl)]" : "flex gap-3 rounded-[var(--radius-xl)] p-3",
      )}
    >
      <TruckCover
        tone={truck.coverTone}
        alt=""
        className={tile ? "aspect-[4/3] w-full" : "h-[76px] w-[76px] shrink-0 rounded-[var(--radius-md)]"}
      />
      <div className={cn("min-w-0", tile ? "p-4" : "flex-1 py-0.5")}>
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="truncate font-semibold tracking-tight">{truck.name}</h3>
          {truck.distanceMiles != null ? (
            <span className="shrink-0 text-xs tabular-nums text-muted">{formatMiles(truck.distanceMiles)}</span>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm text-muted">{CUISINE_LABEL[truck.primaryCuisine]}</p>
        <StatusPill kind={truck.statusKind} className="mt-1.5">
          {truck.statusLabel}
        </StatusPill>
      </div>
    </Link>
  );
}
