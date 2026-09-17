import type { ReactNode } from "react";

export function EmptyState({
  kicker = "Quiet lot",
  title,
  body,
  action,
}: {
  kicker?: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-2 py-16 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">{kicker}</p>
      <h2 className="mt-3 font-display text-2xl font-medium tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-[32ch] text-sm text-muted">{body}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
