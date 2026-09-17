import type { ReactNode } from "react";
import { TabBar } from "./tab-bar";
import { Wordmark } from "./logo";
import { cn } from "@/lib/utils";

export function AppShell({
  mode,
  children,
  flush,
}: {
  mode: "consumer" | "operator";
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-bg lg:flex">
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-surface">
        <div className="px-5 pb-4 pt-6">
          <Wordmark markClassName="size-9" />
        </div>
        <TabBar mode={mode} variant="rail" />
        <p className="mt-auto px-5 pb-6 text-xs leading-relaxed text-muted">Chase the smoke.</p>
      </aside>
      <div className={cn("min-w-0 flex-1", flush ? "" : "mx-auto w-full max-w-3xl lg:max-w-5xl")}>
        <div className={flush ? "" : "pb-[calc(72px+env(safe-area-inset-bottom))] lg:pb-10"}>{children}</div>
      </div>
      <div className="lg:hidden">
        <TabBar mode={mode} variant="dock" />
      </div>
    </div>
  );
}
