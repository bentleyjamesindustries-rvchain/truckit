import { SlidersHorizontal, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAreaStore } from "@/lib/area-store";
import { CUISINES, CUISINE_LABEL, type Cuisine } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const RADII = [5, 8, 12, 20];

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-fg" : "bg-surface text-fg ring-1 ring-border",
      )}
    >
      {children}
    </button>
  );
}

export function FilterBar() {
  const filters = useAreaStore((s) => s.filters);
  const setFilters = useAreaStore((s) => s.setFilters);
  const radius = useAreaStore((s) => s.area.radiusMiles);
  const setRadius = useAreaStore((s) => s.setRadius);
  const [more, setMore] = useState(false);

  function toggleCuisine(c: Cuisine) {
    const has = filters.cuisines.includes(c);
    setFilters({
      cuisines: has ? filters.cuisines.filter((x) => x !== c) : [...filters.cuisines, c],
    });
  }

  const moreActive = more || filters.dinner || filters.late || filters.cuisines.length > 0;

  return (
    <div className="border-b border-border bg-bg">
      <div className="flex gap-2 overflow-x-auto px-5 py-3 lg:px-8 [scrollbar-width:none]">
        <Chip active={filters.openNow} onClick={() => setFilters({ openNow: !filters.openNow })}>
          Open now
        </Chip>
        <Chip active={filters.lunch} onClick={() => setFilters({ lunch: !filters.lunch })}>
          Lunch
        </Chip>
        <Chip active={moreActive} onClick={() => setMore((v) => !v)}>
          <SlidersHorizontal className="mr-1 inline size-3.5" />
          More
        </Chip>
      </div>
      {more ? (
        <div className="space-y-4 border-t border-border px-5 py-4 lg:px-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">More filters</p>
            <button type="button" onClick={() => setMore(false)} className="grid size-11 place-items-center text-muted">
              <X className="size-4" />
            </button>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">Windows</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={filters.dinner} onClick={() => setFilters({ dinner: !filters.dinner })}>
                Dinner
              </Chip>
              <Chip active={filters.late} onClick={() => setFilters({ late: !filters.late })}>
                Late night
              </Chip>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">Radius</p>
            <div className="flex flex-wrap gap-2">
              {RADII.map((n) => (
                <Chip key={n} active={radius === n} onClick={() => setRadius(n)}>
                  {n} mi
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">Cuisine</p>
            <div className="flex flex-wrap gap-2">
              {CUISINES.map((c) => (
                <Chip key={c} active={filters.cuisines.includes(c)} onClick={() => toggleCuisine(c)}>
                  {CUISINE_LABEL[c]}
                </Chip>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="px-0 text-muted"
            onClick={() => {
              setFilters({ late: false, dinner: false, cuisines: [] });
              setMore(false);
            }}
          >
            Clear more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
