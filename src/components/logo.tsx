import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function SmokeMark({ className }: { className?: string }) {
  return (
    <img
      src="/brand/mark.jpg"
      alt=""
      width={72}
      height={72}
      className={cn("shrink-0 rounded-[28%] object-cover ring-1 ring-border/80", className)}
    />
  );
}

export function Wordmark({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2.5 text-primary", className)}>
      <SmokeMark className={cn("size-9", markClassName)} />
      <span className="text-lg font-semibold leading-none tracking-[-0.04em]">TRUCKIT</span>
    </Link>
  );
}
