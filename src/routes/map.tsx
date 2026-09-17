import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { AreaBar } from "@/components/area-bar";
import { FilterBar } from "@/components/filter-bar";
import { MapCanvas } from "@/components/map-canvas";
import { StatusPill } from "@/components/status-pill";
import { TruckCover } from "@/components/truck-cover";
import { useAreaStore } from "@/lib/area-store";
import { CUISINE_LABEL } from "@/lib/types";
import { listTrucks } from "@/lib/server/catalog";

export const Route = createFileRoute("/map")({ component: MapPage });

function MapPage() {
  const area = useAreaStore((s) => s.area);
  const filters = useAreaStore((s) => s.filters);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["trucks", area.lat, area.lng, area.radiusMiles, filters],
    queryFn: () =>
      listTrucks({
        data: { lat: area.lat, lng: area.lng, radiusMiles: area.radiusMiles, filters },
      }),
    refetchInterval: 20_000,
  });
  const items = data?.items ?? [];
  const pin = items.find((t) => t.id === selected) ?? null;

  return (
    <AppShell mode="consumer" flush>
      <div className="relative flex h-[calc(100dvh-72px-env(safe-area-inset-bottom))] flex-col lg:h-dvh">
        <AreaBar />
        <FilterBar />
        <div className="relative min-h-0 flex-1">
          <MapCanvas
            center={{ lat: area.lat, lng: area.lng }}
            trucks={items}
            selectedId={selected}
            onSelect={setSelected}
          />
          {pin ? (
            <button
              type="button"
              onClick={() => navigate({ to: "/trucks/$id", params: { id: pin.id } })}
              className="absolute inset-x-3 bottom-3 flex gap-3 rounded-[var(--radius-xl)] bg-surface p-3 text-left shadow-[var(--shadow-float)] ring-1 ring-border lg:max-w-md"
            >
              <TruckCover tone={pin.coverTone} className="h-16 w-16 rounded-[10px]" alt="" />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold tracking-tight">{pin.name}</span>
                <span className="block text-sm text-muted">{CUISINE_LABEL[pin.primaryCuisine]}</span>
                <StatusPill kind={pin.statusKind} className="mt-1">
                  {pin.statusLabel}
                </StatusPill>
              </span>
            </button>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
