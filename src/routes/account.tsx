import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useAreaStore } from "@/lib/area-store";
import { getMyAccount, updateMyProfile } from "@/lib/server/operator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  const { user, isPending } = useCurrentUserState();
  const rolePref = useAreaStore((s) => s.rolePref);

  if (isPending) {
    return (
      <AppShell mode={rolePref === "operator" ? "operator" : "consumer"}>
        <div className="h-32 animate-pulse bg-wash" />
      </AppShell>
    );
  }
  if (!user) {
    return (
      <AppShell mode="consumer">
        <PageHeader title="Account" />
        <div className="px-5 py-10 lg:px-8">
          <h1 className="font-display text-2xl font-medium tracking-tight lg:hidden">Account</h1>
          <p className="mt-2 text-sm text-muted">Sign in to save your truck, switch roles, and check in live.</p>
          <Link to="/login" className="mt-6 block">
            <Button className="w-full">Sign in</Button>
          </Link>
          <Link to="/signup" className="mt-3 block">
            <Button variant="outline" className="w-full">
              Create an account
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return <SignedInAccount />;
}

function SignedInAccount() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const setRolePref = useAreaStore((s) => s.setRolePref);
  const { data } = useQuery({ queryKey: ["account"], queryFn: () => getMyAccount() });
  const [name, setName] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (payload: { displayName?: string; role?: "consumer" | "operator" }) =>
      updateMyProfile({ data: payload }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["account"] }),
  });

  const profile = data?.profile;
  const truck = data?.truck;
  const display = name ?? profile?.display_name ?? "";
  const role = profile?.role === "operator" ? "operator" : "consumer";

  async function switchRole(next: "consumer" | "operator") {
    setRolePref(next);
    await save.mutateAsync({ role: next, displayName: display || undefined });
    if (next === "operator") navigate({ to: truck ? "/op/today" : "/op/onboarding" });
    else navigate({ to: "/list" });
  }

  return (
    <AppShell mode={role === "operator" ? "operator" : "consumer"}>
      <PageHeader title="Account" />
      <div className="px-5 pt-4 lg:px-8">
        <h1 className="font-display text-2xl font-medium tracking-tight lg:hidden">Account</h1>
        <div className="mt-6 rounded-[var(--radius-xl)] bg-surface p-4 ring-1 ring-border">
          <UserButton />
        </div>

        <label className="mt-6 block text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Display name
        </label>
        <Input
          value={display}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => {
            if (display.trim()) void save.mutateAsync({ displayName: display.trim() });
          }}
          className="mt-2"
        />

        <p className="mt-8 text-xs font-medium uppercase tracking-[0.14em] text-muted">Mode</p>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-[var(--radius-lg)] bg-wash p-1">
          {(["consumer", "operator"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => void switchRole(r)}
              className={cn(
                "h-11 rounded-[12px] text-sm font-medium",
                role === r ? "bg-surface text-fg shadow-sm" : "text-muted",
              )}
            >
              {r === "consumer" ? "Consumer" : "Operator"}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">
          {truck ? `Truck: ${truck.name}` : "No truck yet — switch to Operator to publish one."}
        </p>
      </div>
    </AppShell>
  );
}
