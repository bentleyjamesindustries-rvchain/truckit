import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Search = { next?: string };

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: Login,
});

function Login() {
  const { next } = Route.useSearch();
  const dest = next && next.startsWith("/") ? next : "/list";
  const router = useRouter();
  const { user, isPending } = useCurrentUserState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isPending && user) router.history.push(dest);
  }, [isPending, user, dest, router]);

  async function onEmail(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.signIn.email({ email, password, callbackURL: dest });
    setBusy(false);
    if (err) setError(err.message ?? "Sign-in failed");
    else window.location.href = dest;
  }

  return (
    <AuthLayout title="Sign in" subtitle="Operators and hungry people, same door.">
      {!authEnabled ? (
        <p className="text-sm text-muted">Sign-in is disabled.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => signIn(p.providerId, { callbackURL: dest })}
            >
              Continue with {p.label}
            </Button>
          ))}
          <div className="relative my-3 text-center text-xs font-medium uppercase tracking-wider text-muted">
            <span className="bg-bg px-3">or email</span>
            <span className="absolute inset-x-0 top-1/2 -z-10 h-px bg-border" />
          </div>
          <form className="flex flex-col gap-3" onSubmit={(e) => void onEmail(e)}>
            <Input
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error ? <p className="text-sm text-accent">{error}</p> : null}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="pt-4 text-center text-sm text-muted">
            New here?{" "}
            <Link to="/signup" search={{ next: dest }} className="font-medium text-primary underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  );
}
