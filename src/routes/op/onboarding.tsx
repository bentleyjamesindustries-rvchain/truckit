import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PLACES } from "@/lib/geo";
import { CUISINES, CUISINE_LABEL, type Cuisine, type WindowKind } from "@/lib/types";
import { upsertMyTruck, upsertStop } from "@/lib/server/operator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/op/onboarding")({ component: Onboarding });

const PLACE_OPTS = [PLACES.downtown, PLACES.officePark, PLACES.dinnerLot, PLACES.harbor];

function Onboarding() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState<Cuisine>("bbq");
  const [city, setCity] = useState("Westbrook");
  const [bio, setBio] = useState("");
  const [windows, setWindows] = useState<WindowKind[]>(["lunch", "dinner"]);
  const [place, setPlace] = useState(PLACES.downtown);
  const [start, setStart] = useState(defaultStart());
  const [end, setEnd] = useState(defaultEnd());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending) return <AppShell mode="operator"><div className="h-32 animate-pulse bg-wash" /></AppShell>;
  if (!user) return <RedirectToSignIn to="/login" />;

  function toggleWindow(w: WindowKind) {
    setWindows((cur) => (cur.includes(w) ? cur.filter((x) => x !== w) : [...cur, w]));
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const truck = await upsertMyTruck({
        data: {
          name,
          primaryCuisine: cuisine,
          bio: bio || undefined,
          serviceCity: city,
          typicalWindows: windows.length ? windows : ["lunch", "dinner"],
          status: "live",
          serviceLat: place.lat,
          serviceLng: place.lng,
        },
      });
      await upsertStop({
        data: {
          placeName: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(end).toISOString(),
        },
      });
      void truck;
      navigate({ to: "/op/today" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell mode="operator">
      <PageHeader title="Onboarding" />
      <div className="px-5 pt-4 lg:px-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Step {step} of 2</p>
        {step === 1 ? (
          <>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your truck</h1>
            <label className="mt-6 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              className="mt-1 h-12 w-full rounded-[var(--radius-lg)] border border-border bg-surface px-4 outline-none focus:ring-2 focus:ring-primary/30"
            />
            <label className="mt-4 block text-sm font-medium">Cuisine</label>
            <select
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value as Cuisine)}
              className="mt-1 h-12 w-full rounded-[var(--radius-lg)] border border-border bg-surface px-3 outline-none"
            >
              {CUISINES.map((c) => (
                <option key={c} value={c}>
                  {CUISINE_LABEL[c]}
                </option>
              ))}
            </select>
            <label className="mt-4 block text-sm font-medium">Service city</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 h-12 w-full rounded-[var(--radius-lg)] border border-border bg-surface px-4 outline-none focus:ring-2 focus:ring-primary/30"
            />
            <label className="mt-4 block text-sm font-medium">Typical windows</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["lunch", "dinner", "breakfast", "late_night"] as WindowKind[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => toggleWindow(w)}
                  className={cn(
                    "h-9 rounded-full px-3.5 text-sm font-medium",
                    windows.includes(w) ? "bg-primary text-primary-fg" : "bg-wash",
                  )}
                >
                  {w === "late_night" ? "Late" : w[0].toUpperCase() + w.slice(1)}
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm font-medium">Bio</label>
            <textarea
              value={bio}
              maxLength={280}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-[var(--radius-lg)] border border-border bg-surface p-3 outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button className="mt-8 w-full" disabled={name.trim().length < 2} onClick={() => setStep(2)}>
              Next — first stop
            </Button>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">First stop</h1>
            <p className="mt-1 text-sm text-muted">Lunch and dinner lots first. You can add more later.</p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              {PLACE_OPTS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setPlace(p)}
                  className={cn(
                    "rounded-[var(--radius-md)] px-3 py-3 text-left text-sm ring-1",
                    place.name === p.name ? "bg-wash ring-primary text-primary" : "bg-surface ring-border",
                  )}
                >
                  <span className="block font-medium">{p.name}</span>
                  <span className="text-xs text-muted">{p.address}</span>
                </button>
              ))}
            </div>
            <label className="mt-4 block text-sm font-medium">Starts</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 h-12 w-full rounded-[var(--radius-lg)] border border-border bg-surface px-3"
            />
            <label className="mt-4 block text-sm font-medium">Ends</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 h-12 w-full rounded-[var(--radius-lg)] border border-border bg-surface px-3"
            />
            {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
            <div className="mt-8 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" disabled={busy} onClick={() => void finish()}>
                {busy ? "Publishing…" : "Go live"}
              </Button>
            </div>
          </>
        )}
        <p className="mt-6 text-center text-sm">
          <Link to="/list" className="text-muted underline-offset-4 hover:underline">
            Skip for now
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function defaultStart() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(11);
  return toLocalInput(d);
}
function defaultEnd() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(14);
  d.setMinutes(30);
  return toLocalInput(d);
}
