import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { toLocalInput } from "@/components/stop-form";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { PLACE_OPTS } from "@/lib/geo";
import { createMeetup } from "@/lib/server/operator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/op/meetups/new")({ component: NewMeetup });

const DEFAULT_PLACE = PLACE_OPTS.find((p) => p.name.includes("Regional")) ?? PLACE_OPTS[0]!;

function NewMeetup() {
  const { user, isPending } = useCurrentUserState();
  const navigate = useNavigate();
  const [name, setName] = useState("Dinner lot meetup");
  const [place, setPlace] = useState(DEFAULT_PLACE);
  const [start, setStart] = useState(toLocalInput(new Date(Date.now() + 2 * 3600 * 1000)));
  const [end, setEnd] = useState(toLocalInput(new Date(Date.now() + 5 * 3600 * 1000)));
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isPending)
    return (
      <AppShell mode="operator">
        <div className="h-24 animate-pulse bg-wash" />
      </AppShell>
    );
  if (!user) return <RedirectToSignIn to="/login" />;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await createMeetup({
        data: {
          name,
          description: description || undefined,
          placeName: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          startsAt: new Date(start).toISOString(),
          endsAt: new Date(end).toISOString(),
        },
      });
      navigate({ to: "/meetups/$id", params: { id: res.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create meetup");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell mode="operator">
      <div className="px-5 pt-6">
        <Link to="/op/meetups" className="inline-flex items-center gap-1 text-sm text-muted">
          <ArrowLeft className="size-4" /> Meetups
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Host a meetup</h1>
        <div className="mt-6 flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-4 outline-none"
          />
          <div className="grid grid-cols-2 gap-2">
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
                {p.name}
              </button>
            ))}
          </div>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-3"
          />
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-3"
          />
          <textarea
            value={description}
            maxLength={400}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Notes for other trucks"
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-3 outline-none"
          />
          {error ? <p className="text-sm text-accent">{error}</p> : null}
          <Button disabled={busy || name.trim().length < 2} onClick={() => void save()}>
            {busy ? "Creating…" : "Create meetup"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
