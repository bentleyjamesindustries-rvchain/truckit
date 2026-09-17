import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StopForm } from "@/components/stop-form";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyTruckToday } from "@/lib/server/operator";

export const Route = createFileRoute("/op/stops/$id")({ component: EditStop });

function EditStop() {
  const { id } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  const { data } = useQuery({
    queryKey: ["op-today"],
    queryFn: () => getMyTruckToday(),
    enabled: Boolean(user),
  });
  const stop = data?.stops.find((s) => s.id === id);
  if (isPending) return <AppShell mode="operator"><div className="h-24 animate-pulse bg-wash" /></AppShell>;
  if (!user) return <RedirectToSignIn to="/login" />;
  return (
    <AppShell mode="operator">
      <div className="px-5 pt-6">
        <Link to="/op/schedule" className="inline-flex items-center gap-1 text-sm text-muted">
          <ArrowLeft className="size-4" /> Schedule
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Edit stop</h1>
        <div className="mt-6">
          {stop ? (
            <StopForm
              id={stop.id}
              initial={{
                placeName: stop.placeName,
                address: stop.address,
                lat: stop.lat,
                lng: stop.lng,
                startsAt: stop.startsAt,
                endsAt: stop.endsAt,
                title: stop.title,
              }}
            />
          ) : (
            <p className="text-sm text-muted">Stop not found.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
