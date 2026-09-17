import type { ReactNode } from "react";
import { Wordmark } from "./logo";

export function PageHeader({
  title,
  action,
}: {
  title?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between gap-3 px-5 pb-2 pt-5 lg:px-8 lg:pt-8">
      <div className="flex min-w-0 items-center gap-3">
        <Wordmark className="lg:hidden" markClassName="size-8" />
        {title ? (
          <h1 className="hidden truncate text-2xl font-semibold tracking-tight lg:block">{title}</h1>
        ) : null}
      </div>
      {action}
    </header>
  );
}
