import type { ReactNode } from "react";
import { Wordmark } from "./logo";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary lg:block">
        <img
          src="/brand/logo.jpg"
          alt="A forest-green food truck with the window open and a family following the smoke"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/25" />
        <p className="absolute bottom-12 left-12 right-12 font-display text-5xl font-medium italic leading-tight text-primary-fg">
          Chase the smoke.
        </p>
      </aside>
      <main className="mx-auto flex w-full max-w-md flex-col px-6 py-10">
        <Wordmark markClassName="size-9" />
        <h1 className="mt-10 font-display text-3xl font-medium tracking-[-0.04em]">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
