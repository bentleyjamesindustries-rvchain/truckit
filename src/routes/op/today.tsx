import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { checkInHere, getMyTruckToday, markClosedToday, markRunningLate } from "@/lib/server/operator";
import { pickNextStop, formatTimeRange, formatDay } from "@/lib/time";

export const Route = createFileRoute("/op/today")({ component: TodayPage });

function TodayPage() {
  const { user, isPending } = useCurrentUserState();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["op-today"],
    queryFn: () => getMyTruckToday(),
    enabled: Boolean(user),
    refetchInterval: 15_000,
  });
  const [warn, setWarn] = useState<number | null>(null);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["op-today"] });
    void qc.invalidateQueries({ queryKey: ["trucks"] });
  };

  const here = useMutation({
    mutationFn: async (opts: { force?: boolean; lat?: number; lng?: number; stopId: string }) =>
      checkInHere({ data: { stopId: opts.stopId, lat: opts.lat, lng: opts.lng, force: opts.force } }),
    onSuccess: (res) => {
      if (!res.ok) {
        setWarn(res.warnMeters);
        return;
      }
      setWarn(null);
      toast("You’re on the lot.");
      invalidate();
    },
    onError: (e: Error) => toast(e.message),
  });
  const late = useMutation({
    mutationFn: (stopId: string) => markRunningLate({ data: { stopId, delayMinutes: 20 } }),
    onSuccess: () => {
      toast("Marked running late.");
      invalidate();
    },
  });
  const closed = useMutation({
    mutationFn: () => markClosedToday({ data: { reason: "Closed today" } }),
    onSuccess: () => {
      toast("Closed today.");
      invalidate();
    },
  });

  if (isPending) return <AppShell mode="operator"><div className="h-32 animate-pulse bg-wash" /></AppShell>;
  if (!user) return <RedirectToSignIn to="/login" />;
  if (data && !data.truck) return <Navigate to="/op/onboarding" />;

  const truck = data?.truck;
  const next = data ? pickNextStop(data.stops) : null;
  const live = data?.live ?? (next && (next.status === "here" || next.status === "delayed") ? next : null);
  const focus = live ?? next;

  function captureHere(stopId: string, force = false) {
    if (!navigator.geolocation) {
      here.mutate({ stopId, force, ...pendingCoords });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPendingCoords(coords);
        here.mutate({ stopId, force, ...coords });
      },
      () => here.mutate({ stopId, force }),
      { enableHighAccuracy: true, timeout: 7000 },
    );
  }

  return (
    <AppShell mode="operator">
      <PageHeader title="Today" />
      <div className="px-5 pt-2 lg:px-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Today</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">{truck?.name ?? "Your truck"}</h1>
        {focus ? (
          <div className="mt-6 rounded-[var(--radius-xl)] bg-surface p-5 shadow-[var(--shadow-card)] ring-1 ring-border">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">You’re on</p>
            <p className="mt-2 text-xl font-semibold tracking-tight">{focus.placeName}</p>
            <p className="mt-1 text-sm text-muted">
              {formatDay(focus.startsAt, truck?.timezone)} · {formatTimeRange(focus.startsAt, focus.endsAt, truck?.timezone)}
            </p>
            <p className="mt-1 text-sm text-muted">{focus.address}</p>
            {live?.status === "here" ? (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-live">
                <span className="live-dot" /> Checked in
              </p>
            ) : live?.status === "delayed" ? (
              <p className="mt-4 text-sm font-medium text-amber">Running late · {live.delayMinutes ?? 20} min</p>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 rounded-[var(--radius-xl)] bg-surface p-5 ring-1 ring-border">
            <p className="font-medium">No stop on the board</p>
            <p className="mt-1 text-sm text-muted">Add a lunch or dinner window to check in.</p>
            <Link to="/op/stops/new" className="mt-4 block">
              <Button variant="outline" className="w-full">
                Add a stop
              </Button>
            </Link>
          </div>
        )}

        {warn != null && focus ? (
          <div className="mt-4 rounded-[var(--radius-md)] bg-wash p-4 text-sm">
            <p className="font-medium">You’re about {warn}m from the pin.</p>
            <p className="mt-1 text-muted">Check in anyway?</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setWarn(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => captureHere(focus.id, true)}>
                Check in anyway
              </Button>
            </div>
          </div>
        ) : null}

        {focus ? (
          <div className="mt-6 flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full"
              disabled={here.isPending || focus.status === "here"}
              onClick={() => captureHere(focus.id)}
            >
              We're here
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={late.isPending}
              onClick={() => late.mutate(focus.id)}
            >
              Running late
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted"
              disabled={closed.isPending}
              onClick={() => closed.mutate()}
            >
              Closed today
            </Button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
