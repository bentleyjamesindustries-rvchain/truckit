import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient, authEnabled } from "@/lib/auth/client";
import { AuthLayout } from "@/components/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Search = { next?: string };

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: Signup,
});

function Signup() {
  const { next } = Route.useSearch();
  const dest = next && next.startsWith("/") ? next : "/list";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!authEnabled) return;
    setBusy(true);
    setError(null);
    const { error: err } = await authClient.signUp.email({
      name: name.trim() || "Hungry",
      email,
      password,
      callbackURL: dest,
    });
    setBusy(false);
    if (err) setError(err.message ?? "Could not create account");
    else window.location.href = dest;
  }

  return (
    <AuthLayout title="Create account" subtitle="One account. Switch between finding trucks and running one.">
      <form className="flex flex-col gap-3" onSubmit={(e) => void onSubmit(e)}>
        <Input required placeholder="Display name" value={name} onChange={(e) => setName(e.target.value)} />
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
          minLength={8}
          autoComplete="new-password"
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="text-sm text-accent">{error}</p> : null}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? "Creating…" : "Create account"}
        </Button>
      </form>
      <p className="pt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" search={{ next: dest }} className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
