import type { Stop, WindowKind } from "./types";

export const DEFAULT_TZ = "America/New_York";

export function minutesOfDay(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

export function windowOfMinutes(mins: number): WindowKind | "afternoon" {
  if (mins < 11 * 60) return "breakfast";
  if (mins < 14 * 60 + 30) return "lunch";
  if (mins < 16 * 60 + 30) return "afternoon";
  if (mins < 21 * 60) return "dinner";
  return "late_night";
}

export function stopWindow(stop: { startsAt: string }, timeZone: string): WindowKind | "afternoon" {
  return windowOfMinutes(minutesOfDay(new Date(stop.startsAt), timeZone));
}

/** Open now = live check-in only. Scheduled-in-window is not Open now. */
export function isOpenNow(stop: Stop): boolean {
  return stop.status === "here" || stop.status === "delayed";
}

export function formatTime(iso: string, timeZone = DEFAULT_TZ): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTimeRange(startIso: string, endIso: string, timeZone = DEFAULT_TZ): string {
  return `${formatTime(startIso, timeZone)} – ${formatTime(endIso, timeZone)}`;
}

export function formatDay(iso: string, timeZone = DEFAULT_TZ): string {
  const d = new Date(iso);
  const now = new Date();
  const dayFmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const today = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);
  const label = dayFmt.format(d);
  if (label === today) return "Today";
  const tomorrow = new Date(now.getTime() + 86400000);
  if (label === dayFmt.format(tomorrow)) return "Tomorrow";
  return label;
}

export function statusLabel(stop: Stop | null, timeZone = DEFAULT_TZ): {
  kind: "here" | "delayed" | "window" | "upcoming" | "none";
  text: string;
  open: boolean;
} {
  if (!stop) return { kind: "none", text: "No upcoming stops", open: false };
  if (stop.status === "closed") {
    return { kind: "none", text: stop.closedReason || "Closed today", open: false };
  }
  if (stop.status === "here") {
    return { kind: "here", text: `Open now · ${stop.placeName}`, open: true };
  }
  if (stop.status === "delayed") {
    const delay = stop.delayMinutes ? ` · ${stop.delayMinutes} min late` : "";
    return { kind: "delayed", text: `Open now${delay} · ${stop.placeName}`, open: true };
  }
  return {
    kind: "upcoming",
    text: `Next at ${formatTime(stop.startsAt, timeZone)} · ${stop.placeName}`,
    open: false,
  };
}

export function pickNextStop(stops: Stop[], now = new Date()): Stop | null {
  const t = now.getTime();
  const active = stops.filter(
    (s) => s.status !== "ended" && s.status !== "closed" && new Date(s.endsAt).getTime() >= t - 30 * 60 * 1000,
  );
  if (active.length === 0) return null;
  const live = active.find((s) => s.status === "here" || s.status === "delayed");
  if (live) return live;
  const upcoming = active
    .filter((s) => new Date(s.endsAt).getTime() >= t)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  return upcoming[0] ?? null;
}
