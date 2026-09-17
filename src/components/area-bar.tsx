import { MapPin, Navigation } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAreaStore } from "@/lib/area-store";
import { formatMiles } from "@/lib/geo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function AreaBar() {
  const area = useAreaStore((s) => s.area);
  const applyQuery = useAreaStore((s) => s.applyQuery);
  const setArea = useAreaStore((s) => s.setArea);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(area.query);

  function submit(e: FormEvent) {
    e.preventDefault();
    const res = applyQuery(q);
    if (!res.ok) {
      toast("Unknown area. Try Westbrook, Downtown, Office park, or a nearby city.");
      return;
    }
    setOpen(false);
  }

  function locate() {
    if (!navigator.geolocation) {
      toast("Location isn’t available here.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setArea({
          query: "Near me",
          label: "Near me",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          radiusMiles: area.radiusMiles,
        });
        setQ("Near me");
        setOpen(false);
      },
      () => toast("Couldn’t read location. Enter an area instead."),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <div className="border-b border-border bg-surface/80 px-5 py-3 backdrop-blur-md lg:px-8">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-h-11 w-full items-center gap-2 text-left">
        <MapPin className="size-4 text-primary" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium uppercase tracking-[0.14em] text-muted">Area</span>
          <span className="block truncate text-sm font-semibold tracking-tight">
            {area.label} <span className="font-normal text-muted">{formatMiles(area.radiusMiles)} radius</span>
          </span>
        </span>
      </button>
      {open ? (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Zip, neighborhood, or city"
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1">
              Set area
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={locate}>
              <Navigation className="size-4" />
              Locate
            </Button>
          </div>
          <p className="text-xs text-muted">Try Downtown, Office park, Dinner lot, Westbrook.</p>
        </form>
      ) : null}
    </div>
  );
}
