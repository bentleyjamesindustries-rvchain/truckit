import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { TruckCover } from "@/components/truck-cover";
import { getMeetup } from "@/lib/server/catalog";
import { getMyAccount, joinMeetup } from "@/lib/server/operator";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { CUISINE_LABEL } from "@/lib/types";
import { formatDay, formatTimeRange } from "@/lib/time";

export const Route = createFileRoute("/meetups/$id")({ component: MeetupDetail });

function MeetupDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { user, isPending: authPending } = useCurrentUserState();
  const { data, isPending } = useQuery({
    queryKey: ["meetup", id],
    queryFn: () => getMeetup({ data: { id } }),
  });
  const accountQ = useQuery({
    queryKey: ["account"],
    queryFn: () => getMyAccount(),
    enabled: Boolean(user),
  });
  const join = useMutation({
    mutationFn: () => joinMeetup({ data: { meetupId: id } }),
    onSuccess: () => {
      toast("You’re on the lot.");
      void qc.invalidateQueries({ queryKey: ["meetup", id] });
    },
    onError: (e: Error) => toast(e.message),
  });

  if (isPending) {
    return (
      <AppShell mode="consumer">
        <div className="h-40 animate-pulse bg-wash" />
      </AppShell>
    );
  }
  if (!data) {
    return (
      <AppShell mode="consumer">
        <div className="px-6 py-20 text-center">
          <h1 className="text-2xl font-semibold">Meetup unavailable</h1>
          <Link to="/meetups" className="mt-4 inline-block text-sm text-primary">
            All meetups
          </Link>
        </div>
      </AppShell>
    );
  }

  const { meetup, members } = data;
  const going = members.filter((m) => m.rsvp === "going");
  const myTruckId = accountQ.data?.truck?.id;
  const already = going.some((m) => m.truckId === myTruckId);

  return (
    <AppShell mode="consumer">
      <div className="relative">
        <TruckCover tone={meetup.coverTone} className="h-48 w-full lg:h-64" alt="" />
        <Link
          to="/meetups"
          className="absolute left-4 top-4 grid size-11 place-items-center rounded-full bg-surface/90 shadow-sm"
        >
          <ArrowLeft className="size-5" />
        </Link>
      </div>
      <div className="px-5 pt-5 lg:px-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{meetup.status}</p>
        <h1 className="mt-1 text-[1.6rem] font-semibold tracking-[-0.04em]">{meetup.name}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <MapPin className="size-3.5" /> {meetup.placeName} · {meetup.address}
        </p>
        <p className="mt-1 text-sm text-muted">
          {formatDay(meetup.startsAt)} · {formatTimeRange(meetup.startsAt, meetup.endsAt)}
        </p>
        {meetup.description ? <p className="mt-4 text-[15px] leading-relaxed">{meetup.description}</p> : null}

        <h2 className="mt-8 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Trucks</h2>
        <ul className="mt-3 space-y-2">
          {going.map((m) => (
            <li key={m.truckId}>
              <Link
                to="/trucks/$id"
                params={{ id: m.truckId }}
                className="flex items-center gap-3 rounded-[var(--radius-md)] bg-surface p-3 ring-1 ring-border"
              >
                <TruckCover tone={m.coverTone} className="size-12 rounded-[10px]" alt="" />
                <span>
                  <span className="block font-medium">{m.truckName}</span>
                  <span className="text-sm text-muted">
                    {CUISINE_LABEL[m.cuisine]} · {m.role === "host" ? "Host" : "Member"}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 pb-6">
          {authPending ? null : !user ? (
            <Link to="/login" search={{ next: `/meetups/${id}` }}>
              <Button variant="outline" className="w-full">
                Sign in to join as an operator
              </Button>
            </Link>
          ) : !accountQ.data?.truck ? (
            <Link to="/op/onboarding">
              <Button variant="outline" className="w-full">
                Add your truck to join
              </Button>
            </Link>
          ) : already ? (
            <p className="text-center text-sm text-muted">Your truck is on this lot.</p>
          ) : (
            <Button className="w-full" disabled={join.isPending} onClick={() => join.mutate()}>
              Join meetup
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
