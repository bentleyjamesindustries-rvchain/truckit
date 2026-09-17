import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StopForm } from "@/components/stop-form";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/op/stops/new")({ component: NewStop });

function NewStop() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <AppShell mode="operator"><div className="h-24 animate-pulse bg-wash" /></AppShell>;
  if (!user) return <RedirectToSignIn to="/login" />;
  return (
    <AppShell mode="operator">
      <div className="px-5 pt-6">
        <Link to="/op/schedule" className="inline-flex items-center gap-1 text-sm text-muted">
          <ArrowLeft className="size-4" /> Schedule
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Add stop</h1>
        <div className="mt-6">
          <StopForm />
        </div>
      </div>
    </AppShell>
  );
}
