import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Radio, UtensilsCrossed } from "lucide-react";
import { Wordmark } from "@/components/logo";
import { TruckRow } from "@/components/truck-row";
import { Button, buttonVariants } from "@/components/ui/button";
import { SignInGate } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useAreaStore } from "@/lib/area-store";
import { listTrucks } from "@/lib/server/catalog";
import { getMyAccount } from "@/lib/server/operator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: Splash });

function Splash() {
  const navigate = useNavigate();
  const mark = useAreaStore((s) => s.markSeenSplash);
  const area = useAreaStore((s) => s.area);
  const { user, isPending } = useCurrentUserState();
  const featured = useQuery({
    queryKey: ["landing-trucks", area.lat, area.lng],
    queryFn: () =>
      listTrucks({
        data: {
          lat: area.lat,
          lng: area.lng,
          radiusMiles: area.radiusMiles,
          filters: { openNow: false, lunch: false, dinner: false, late: false, cuisines: [] },
        },
      }),
  });

  async function runTruck() {
    mark();
    if (isPending) return;
    if (!user) {
      navigate({ to: "/login", search: { next: "/op/onboarding" } });
      return;
    }
    try {
      const account = await getMyAccount();
      navigate({ to: account.truck ? "/op/today" : "/op/onboarding" });
    } catch {
      navigate({ to: "/op/onboarding" });
    }
  }

  const trucks = featured.data?.items ?? [];

  return (
    <div className="min-h-dvh bg-bg">
      <header className="nav-frost sticky top-0 z-40 border-b border-border">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 lg:h-[4.5rem] lg:px-8">
          <Wordmark markClassName="size-9" />
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
            <a href="#how" className="hover:text-fg">
              How it works
            </a>
            <a href="#lots" className="hover:text-fg">
              On the lot
            </a>
            <a href="#operators" className="hover:text-fg">
              Operators
            </a>
          </nav>
          <div className="flex items-center gap-4">
            {isPending ? (
              <span className="h-5 w-14 animate-pulse rounded-full bg-wash" />
            ) : (
              <SignInGate
                fallback={
                  <Link to="/login" className="text-sm font-medium text-muted underline-offset-4 hover:text-fg hover:underline">
                    Sign in
                  </Link>
                }
              >
                <Link to="/account" className="text-sm font-medium text-muted underline-offset-4 hover:text-fg hover:underline">
                  Account
                </Link>
              </SignInGate>
            )}
            <Link
              to="/list"
              onClick={() => mark()}
              className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}
            >
              Find trucks
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-8 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="hero-stagger">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Live lots</p>
          <h1 className="mt-4 font-display text-5xl font-medium italic leading-[1.05] tracking-[-0.035em] text-primary lg:text-7xl">
            Chase the smoke.
          </h1>
          <p className="mt-5 max-w-[34ch] text-base leading-relaxed text-muted lg:text-lg">
            Find the truck that’s open now. Operators check in live — lunch, dinner, no ghost pins.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/list" onClick={() => mark()} className={cn(buttonVariants({ size: "lg" }), "sm:min-w-44")}>
              Find trucks
            </Link>
            <Button variant="outline" size="lg" className="sm:min-w-44" onClick={() => void runTruck()}>
              I run a truck
            </Button>
          </div>
          <p className="mt-5 text-sm text-muted">Live check-ins · Lunch and dinner lots · Operator meetups</p>
        </div>
        <figure className="overflow-hidden rounded-[2rem] bg-wash shadow-[var(--shadow-float)] ring-1 ring-border">
          <img
            src="/brand/logo.jpg"
            alt="A forest-green food truck with the window open, smoke trailing behind, and a family following the scent"
            width={1408}
            height={1408}
            className="aspect-square w-full object-cover lg:aspect-[4/5]"
          />
        </figure>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:grid-cols-3 lg:px-8 lg:py-12">
          <Stat icon={Radio} label="Live check-ins" body="We're here hits the list in about 20 seconds." />
          <Stat icon={UtensilsCrossed} label="Lunch and dinner" body="Office parks, downtown lots, riverfront after dusk." />
          <Stat icon={MapPin} label="Honest empty cities" body="If nobody’s posted a stop, we say so." />
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">How it works</p>
        <h2 className="mt-3 max-w-[18ch] font-display text-4xl font-medium tracking-tight lg:text-5xl">
          Follow the smoke. Eat.
        </h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          <Step n="01" title="Pick an area" body="Westbrook, downtown, the office park, or a dinner lot. Widen search if it’s quiet." />
          <Step n="02" title="Filter the window" body="Open now, Lunch, or Dinner. Status sits where the witty line used to be." />
          <Step n="03" title="Hit the pin" body="Map preview, truck page, meetup lot. No ordering, no fake counts." />
        </ol>
      </section>

      <section id="lots" className="mx-auto max-w-6xl px-5 pb-16 lg:px-8 lg:pb-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">On the lot</p>
            <h2 className="mt-3 font-display text-3xl font-medium tracking-tight lg:text-4xl">Westbrook right now</h2>
          </div>
          <Link to="/list" onClick={() => mark()} className="hidden text-sm font-semibold text-primary underline-offset-4 hover:underline sm:block">
            See all
          </Link>
        </div>
        {featured.isPending ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-[var(--radius-xl)] bg-wash" />
            ))}
          </div>
        ) : trucks.length === 0 ? (
          <p className="mt-8 text-sm text-muted">No trucks here yet. Check back at lunch.</p>
        ) : (
          <ul className="list-stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trucks.slice(0, 6).map((t) => (
              <li key={t.id}>
                <TruckRow truck={t} variant="tile" />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="operators" className="bg-primary text-primary-fg">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-fg/70">Operators</p>
            <h2 className="mt-3 font-display text-4xl font-medium tracking-tight lg:text-5xl">Post a stop. Tap We’re here.</h2>
            <p className="mt-4 max-w-[40ch] text-primary-fg/80">
              One truck per account. Lunch and dinner windows. Running late or closed today — hungry people see it on the list.
            </p>
            <Button
              variant="accent"
              size="lg"
              className="mt-8"
              onClick={() => void runTruck()}
            >
              I run a truck
            </Button>
          </div>
          <figure className="overflow-hidden rounded-[var(--radius-xl)] ring-1 ring-primary-fg/10">
            <img
              src="/brand/hero.jpg"
              alt="Golden-hour food truck on an urban dinner lot with a family following the smoke"
              width={1792}
              height={1008}
              className="aspect-video w-full object-cover"
            />
          </figure>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Wordmark markClassName="size-8" />
          <p className="text-sm text-muted">Find the truck. Run the truck. No payments in this version.</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  body,
}: {
  icon: typeof Radio;
  label: string;
  body: string;
}) {
  return (
    <div>
      <Icon className="size-5 text-primary" strokeWidth={1.8} />
      <p className="mt-3 font-semibold tracking-tight">{label}</p>
      <p className="mt-1 text-sm text-muted">{body}</p>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="rounded-[var(--radius-xl)] bg-surface p-6 shadow-[var(--shadow-card)] ring-1 ring-border">
      <p className="font-display text-sm italic text-primary">{n}</p>
      <h3 className="mt-3 text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
    </li>
  );
}
