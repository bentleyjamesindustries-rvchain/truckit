import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getMyAccount, upsertMyTruck } from "@/lib/server/operator";
import { CUISINES, CUISINE_LABEL, type Cuisine } from "@/lib/types";

export const Route = createFileRoute("/op/truck")({ component: TruckProfile });

function TruckProfile() {
  const { user, isPending } = useCurrentUserState();
  const { data } = useQuery({
    queryKey: ["account"],
    queryFn: () => getMyAccount(),
    enabled: Boolean(user),
  });
  const truck = data?.truck;
  const [name, setName] = useState("");
  const [cuisine, setCuisine] = useState<Cuisine>("bbq");
  const [city, setCity] = useState("Westbrook");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!truck) return;
    setName(truck.name);
    setCuisine(truck.primaryCuisine);
    setCity(truck.serviceCity);
    setBio(truck.bio ?? "");
    setInstagram(truck.instagramUrl ?? "");
    setWebsite(truck.websiteUrl ?? "");
  }, [truck]);

  if (isPending) return <AppShell mode="operator"><div className="h-32 animate-pulse bg-wash" /></AppShell>;
  if (!user) return <RedirectToSignIn to="/login" />;
  if (data && !truck) return <Navigate to="/op/onboarding" />;

  async function save(status?: "live" | "paused") {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await upsertMyTruck({
        data: {
          name,
          primaryCuisine: cuisine,
          serviceCity: city,
          bio: bio || undefined,
          instagramUrl: instagram || undefined,
          websiteUrl: website || undefined,
          typicalWindows: truck?.typicalWindows?.length ? truck.typicalWindows : ["lunch", "dinner"],
          status,
        },
      });
      toast("Truck saved.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell mode="operator">
      <PageHeader title="Truck" />
      <div className="px-5 pt-2 pb-8 lg:px-8">
        <h1 className="text-2xl font-semibold tracking-tight lg:hidden">Truck</h1>
        <div className="mt-5 flex flex-col gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-4 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <select
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value as Cuisine)}
            className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-3"
          >
            {CUISINES.map((c) => (
              <option key={c} value={c}>
                {CUISINE_LABEL[c]}
              </option>
            ))}
          </select>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-4 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <textarea
            value={bio}
            maxLength={280}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="rounded-[var(--radius-lg)] border border-border bg-surface p-3 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="Instagram URL"
            className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-4 outline-none"
          />
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Website URL"
            className="h-12 rounded-[var(--radius-lg)] border border-border bg-surface px-4 outline-none"
          />
          <Button disabled={busy} onClick={() => void save()}>
            Save
          </Button>
          {truck?.status !== "live" ? (
            <Button variant="primary" disabled={busy} onClick={() => void save("live")}>
              Publish truck
            </Button>
          ) : (
            <Button variant="outline" disabled={busy} onClick={() => void save("paused")}>
              Pause listing
            </Button>
          )}
          {truck ? (
            <Link to="/trucks/$id" params={{ id: truck.id }} className="text-center text-sm text-primary">
              View public page
            </Link>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
