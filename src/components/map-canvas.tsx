import { useEffect, useRef } from "react";
import type { TruckListItem } from "@/lib/types";

type Props = {
  center: { lat: number; lng: number };
  trucks: TruckListItem[];
  onSelect: (id: string) => void;
  selectedId?: string | null;
};

export function MapCanvas({ center, trucks, onSelect, selectedId }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const trucksRef = useRef(trucks);
  trucksRef.current = trucks;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;
  const redrawRef = useRef<() => void>(() => {});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let map: import("maplibre-gl").Map | undefined;
    const markers: import("maplibre-gl").Marker[] = [];

    void (async () => {
      const maplibregl = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !ref.current) return;
      map = new maplibregl.Map({
        container: ref.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [center.lng, center.lat],
        zoom: 12.4,
        attributionControl: { compact: true },
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      const redraw = () => {
        if (!map) return;
        map.jumpTo({ center: [center.lng, center.lat], zoom: 12.4 });
        for (const m of markers) m.remove();
        markers.length = 0;
        const list = trucksRef.current;
        for (const t of list) {
          const node = document.createElement("button");
          node.type = "button";
          node.setAttribute("aria-label", t.name);
          const open = t.isOpenNow;
          const selected = selectedRef.current === t.id;
          node.className = [
            "map-pin",
            open ? "map-pin-live" : "",
            selected ? "map-pin-selected" : "",
          ]
            .filter(Boolean)
            .join(" ");
          node.addEventListener("click", (ev) => {
            ev.stopPropagation();
            onSelectRef.current(t.id);
          });
          markers.push(new maplibregl.Marker({ element: node }).setLngLat([t.lng, t.lat]).addTo(map));
        }
        if (list.length > 0) {
          const bounds = new maplibregl.LngLatBounds();
          for (const t of list) bounds.extend([t.lng, t.lat]);
          map.fitBounds(bounds, { padding: 56, maxZoom: 13.4, duration: 0 });
        }
      };

      redrawRef.current = redraw;
      map.on("load", redraw);
      map.once("idle", redraw);
    })();

    return () => {
      cancelled = true;
      redrawRef.current = () => {};
      map?.remove();
    };
  }, [center.lat, center.lng]);

  useEffect(() => {
    redrawRef.current();
  }, [trucks, selectedId, center.lat, center.lng]);

  return <div ref={ref} className="h-full w-full" />;
}
