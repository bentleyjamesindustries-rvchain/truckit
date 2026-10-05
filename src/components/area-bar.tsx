import { MapPin, Navigation } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAreaStore } from "@/lib/area-store";
import {
  GEO_STATES,
  citiesForCounty,
  cityById,
  countiesForState,
  formatMiles,
} from "@/lib/geo";
import { Button } from "./ui/button";

export function AreaBar() {
  const area = useAreaStore((s) => s.area);
  const setCityId = useAreaStore((s) => s.setCityId);
  const locate = useAreaStore((s) => s.locate);
  const [open, setOpen] = useState(false);
  const [stateCode, setStateCode] = useState(area.stateCode || "NY");
  const [countyId, setCountyId] = useState(area.countyId || "ny-onondaga");

  const counties = countiesForState(stateCode);
  const cities = citiesForCounty(countyId);

  function submit(e: FormEvent) {
    e.preventDefault();
    setOpen(false);
  }

  function pickCity(id: string) {
    setCityId(id);
    const city = cityById(id);
    if (city) {
      setStateCode(city.stateCode);
      setCountyId(city.countyId);
    }
    setOpen(false);
  }

  function locateMe() {
    if (!navigator.geolocation) {
      toast("Location isn’t available here.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = locate(pos.coords.latitude, pos.coords.longitude);
        setStateCode(next.stateCode);
        setCountyId(next.countyId);
        setOpen(false);
      },
      () => toast("Couldn’t read location. Pick a city instead."),
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
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
              State
              <select
                value={stateCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const nextCounties = countiesForState(code);
                  const nextCounty = nextCounties[0]?.id ?? "";
                  const nextCity = citiesForCounty(nextCounty)[0];
                  setStateCode(code);
                  setCountyId(nextCounty);
                  if (nextCity) setCityId(nextCity.id);
                }}
                className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-2 text-sm text-fg"
              >
                {GEO_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
              County
              <select
                value={countyId}
                onChange={(e) => {
                  const id = e.target.value;
                  const nextCity = citiesForCounty(id)[0];
                  setCountyId(id);
                  if (nextCity) setCityId(nextCity.id);
                }}
                className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-2 text-sm text-fg"
              >
                {counties.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted">
              City
              <select
                value={area.cityId}
                onChange={(e) => pickCity(e.target.value)}
                className="mt-1 h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface px-2 text-sm text-fg"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" className="flex-1" onClick={() => setOpen(false)}>
              Set area
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={locateMe}>
              <Navigation className="size-4" />
              Locate
            </Button>
          </div>
          <p className="text-xs text-muted">City gates the search. Default is Syracuse, Onondaga, NY.</p>
        </form>
      ) : null}
    </div>
  );
}
