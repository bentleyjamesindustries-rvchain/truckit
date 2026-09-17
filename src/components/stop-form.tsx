import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PLACES } from "@/lib/geo";
import { upsertStop } from "@/lib/server/operator";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const PLACE_OPTS = [PLACES.downtown, PLACES.officePark, PLACES.dinnerLot, PLACES.harbor];

function pad(n: number) {
  return String(n).padStart(2, "0");
}
export function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function StopForm({
  id,
  initial,
}: {
  id?: string;
  initial?: {
    placeName: string;
    address: string;
    lat: number;
    lng: number;
    startsAt: string;
    endsAt: string;
    title?: string | null;
  };
}) {
  const navigate = useNavigate();
  const preset =
    PLACE_OPTS.find((p) => p.name === initial?.placeName) ?? PLACE_OPTS[0];
  const [place, setPlace] = useState(preset);
  const [customName, setCustomName] = useState(initial?.placeName ?? preset.name);
  const [address, setAddress] = useState(initial?.address ?? preset.address);
  const [start, setStart] = useState(
    initial ? toLocalInput(new Date(initial.startsAt)) : toLocalInput(new Date()),
  );
  const [end, setEnd] = useState(
    initial
      ? toLocalInput(new Date(initial.endsAt))
      : toLocalInput(new Date(Date.now() + 3 * 3600 * 1000)),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await upsertStop({
        data: {
          id,
          placeName: customName,
          address,
          lat: place.lat,
          lng: place.lng,
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(end).toISOString(),
        },
      });
      navigate({ to: "/op/schedule" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save stop");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        {PLACE_OPTS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => {
              setPlace(p);
              setCustomName(p.name);
              setAddress(p.address);
            }}
            className={cn(
              "rounded-[var(--radius-md)] px-3 py-3 text-left text-sm ring-1",
              place.name === p.name ? "bg-wash ring-primary text-primary" : "bg-surface ring-border",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
      <input
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        placeholder="Place name"
        className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-4 outline-none focus:ring-2 focus:ring-primary/30"
      />
      <input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Address"
        className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-4 outline-none focus:ring-2 focus:ring-primary/30"
      />
      <label className="text-sm font-medium">Starts</label>
      <input
        type="datetime-local"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-3"
      />
      <label className="text-sm font-medium">Ends</label>
      <input
        type="datetime-local"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-3"
      />
      {error ? <p className="text-sm text-accent">{error}</p> : null}
      <Button disabled={busy || !customName.trim()} onClick={() => void save()}>
        {busy ? "Saving…" : "Save stop"}
      </Button>
    </div>
  );
}
