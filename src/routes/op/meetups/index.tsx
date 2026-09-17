import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useAreaStore } from "@/lib/area-store";
import { listMeetups } from "@/lib/server/catalog";
import { getMyAccount } from "@/lib/server/operator";
import { formatDay, formatTimeRange } from "@/lib/time";

export const Route = createFileRoute("/op/meetups/")({ component: OpMeetups });

function OpMeetups() {
  const { user, isPending } = useCurrentUserState();
  const area = useAreaStore((s) => s.area);
  const { data } = useQuery({
    queryKey: ["meetups", area.lat, area.lng, area.radiusMiles],
    queryFn: () => listMeetups({ data: { lat: area.lat, lng: area.lng, radiusMiles: 25 } }),
    enabled: Boolean(user),
  });
  const account = useQuery({
    queryKey: ["account"],
    queryFn: () => getMyAccount(),
    enabled: Boolean(user),
  });

  if (isPending)
    return (
      <AppShell mode="operator">
        <div className="h-24 animate-pulse bg-wash" />
      </AppShell>
    );
  if (!user) return <RedirectToSignIn to="/login" />;

  const items = data?.items ?? [];

  return (
    <AppShell mode="operator">
      <PageHeader
        title="Meetups"
        action={
          <Link to="/op/meetups/new">
            <Button size="sm" variant="outline" disabled={!account.data?.truck}>
              <Plus className="size-4" /> Host
            </Button>
          </Link>
        }
      />
      <div className="px-5 pt-2 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight lg:hidden">Meetups</h1>
        <ul className="mt-5 space-y-3">
          {items.length === 0 ? (
            <li className="rounded-[var(--radius-md)] bg-surface p-5 text-sm text-muted ring-1 ring-border">
              No meetups on the board. Host one at the dinner lot.
            </li>
          ) : (
            items.map((m) => (
              <li key={m.id}>
                <Link
                  to="/meetups/$id"
                  params={{ id: m.id }}
                  className="block rounded-[var(--radius-md)] bg-surface p-4 ring-1 ring-border"
                >
                  <p className="font-medium">{m.name}</p>
                  <p className="mt-1 text-sm text-muted">
                    {m.placeName} · {formatDay(m.startsAt)} · {formatTimeRange(m.startsAt, m.endsAt)}
                  </p>
                  <p className="mt-1 text-sm text-primary">{m.memberCount} trucks</p>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </AppShell>
  );
}
