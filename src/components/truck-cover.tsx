import { cn } from "@/lib/utils";

const COVERS: Record<string, string> = {
  ember: "/brand/trucks/ember.jpg",
  steel: "/brand/trucks/steel.jpg",
  harbor: "/brand/trucks/harbor.jpg",
  lotus: "/brand/trucks/lotus.jpg",
  finch: "/brand/trucks/finch.jpg",
  copper: "/brand/trucks/copper.jpg",
};

export function TruckCover({
  tone,
  className,
  alt = "",
}: {
  tone: string;
  className?: string;
  alt?: string;
}) {
  const src = COVERS[tone] ?? "/brand/mark.jpg";
  return (
    <div className={cn("relative overflow-hidden bg-wash", className)}>
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}
