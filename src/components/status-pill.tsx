import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatusPill({
  kind,
  children,
  className,
}: {
  kind: "here" | "delayed" | "window" | "upcoming" | "none";
  children: ReactNode;
  className?: string;
}) {
  const open = kind === "here" || kind === "delayed" || kind === "window";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[13px] font-medium",
        open ? "text-live" : "text-muted",
        className,
      )}
    >
      {open ? <span className="live-dot" /> : <span className="size-1.5 rounded-full bg-border" />}
      {children}
    </span>
  );
}
