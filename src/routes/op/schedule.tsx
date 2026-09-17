import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { deleteStop, getMyTruckToday } from "@/lib/server/operator";
import { formatDay, formatTimeRange } from "@/lib/time";

export const Route = createFileRoute("/op/schedule")({ component: SchedulePage });

function SchedulePage() {
  const { user, isPending } = useCurrentUserState();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["op-today"],
    queryFn: () => getMyTruckToday(),
    enabled: Boolean(user),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteStop({ data: { id } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["op-today"] }),
  });

  if (isPending) return <AppShell mode="operator"><div className="h-32 animate-pulse bg-wash" /></AppShell>;
  if (!user) return <RedirectToSignIn to="/login" />;

  const stops = (data?.stops ?? []).filter((s) => s.status !== "ended");

  return (
    <AppShell mode="operator">
      <PageHeader
        title="Schedule"
        action={
          <Link to="/op/stops/new">
            <Button size="sm" variant="outline">
              <Plus className="size-4" /> Add
            </Button>
          </Link>
        }
      />
      <div className="px-5 pt-2 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight lg:hidden">Schedule</h1>
        <ul className="mt-5 space-y-3">
          {stops.length === 0 ? (
            <li className="rounded-[var(--radius-md)] bg-surface p-5 text-sm text-muted ring-1 ring-border">
              No stops yet. Add a lunch or dinner window.
            </li>
          ) : (
            stops.map((s) => (
              <li key={s.id} className="rounded-[var(--radius-md)] bg-surface p-4 ring-1 ring-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{s.placeName}</p>
                    <p className="mt-1 text-sm text-muted">
                      {formatDay(s.startsAt)} · {formatTimeRange(s.startsAt, s.endsAt)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-muted">{s.status}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Link
                      to="/op/stops/$id"
                      params={{ id: s.id }}
                      className="text-sm font-medium text-primary"
                    >
                      Edit
                    </Link>
                    {s.status === "scheduled" ? (
                      <button
                        type="button"
                        className="text-sm text-muted"
                        onClick={() => remove.mutate(s.id)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </AppShell>
  );
}
