import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, List, Map, Store, Truck, UserRound, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { to: string; label: string; icon: typeof List; match: string[] };

const CONSUMER: Tab[] = [
  { to: "/list", label: "List", icon: List, match: ["/list"] },
  { to: "/map", label: "Map", icon: Map, match: ["/map"] },
  { to: "/meetups", label: "Meetups", icon: Users, match: ["/meetups", "/lots"] },
  { to: "/account", label: "Account", icon: UserRound, match: ["/account"] },
];

const OPERATOR: Tab[] = [
  { to: "/op/today", label: "Today", icon: Truck, match: ["/op/today"] },
  { to: "/op/schedule", label: "Schedule", icon: CalendarDays, match: ["/op/schedule", "/op/stops"] },
  { to: "/op/meetups", label: "Meetups", icon: Users, match: ["/op/meetups"] },
  { to: "/op/truck", label: "Truck", icon: Store, match: ["/op/truck", "/op/onboarding"] },
  { to: "/account", label: "Account", icon: UserRound, match: ["/account"] },
];

export function TabBar({
  mode,
  variant = "dock",
}: {
  mode: "consumer" | "operator";
  variant?: "dock" | "rail";
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = mode === "operator" ? OPERATOR : CONSUMER;
  const rail = variant === "rail";

  return (
    <nav
      className={
        rail
          ? "px-3"
          : "tab-frost fixed inset-x-0 bottom-0 z-40 border-t border-border"
      }
      style={rail ? undefined : { paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul
        className={rail ? "flex flex-col gap-1" : "mx-auto grid max-w-lg"}
        style={rail ? undefined : { gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}
      >
        {tabs.map((tab) => {
          const active = tab.match.some((m) => pathname === m || pathname.startsWith(m + "/"));
          const Icon = tab.icon;
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                className={cn(
                  rail
                    ? "flex h-11 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium"
                    : "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-wide",
                  active
                    ? rail
                      ? "bg-wash text-primary"
                      : "text-primary"
                    : "text-muted hover:text-fg",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
