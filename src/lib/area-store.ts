import { create } from "zustand";
import { persist } from "zustand/middleware";
import { WESTBROOK, geocodeArea } from "./geo";
import type { Area, CatalogFilters, UserRole } from "./types";

type AreaState = {
  area: Area;
  filters: CatalogFilters;
  rolePref: UserRole;
  seenSplash: boolean;
  setArea: (area: Area) => void;
  applyQuery: (query: string) => { ok: true; area: Area } | { ok: false };
  setRadius: (miles: number) => void;
  setFilters: (partial: Partial<CatalogFilters>) => void;
  resetFilters: () => void;
  setRolePref: (role: UserRole) => void;
  markSeenSplash: () => void;
};

const defaultFilters: CatalogFilters = {
  openNow: false,
  lunch: false,
  dinner: false,
  late: false,
  cuisines: [],
};

export const useAreaStore = create<AreaState>()(
  persist(
    (set, get) => ({
      area: WESTBROOK,
      filters: defaultFilters,
      rolePref: "consumer",
      seenSplash: false,
      setArea: (area) => set({ area }),
      applyQuery: (query) => {
        const hit = geocodeArea(query);
        if (!hit) return { ok: false };
        const area: Area = {
          query,
          label: hit.label,
          lat: hit.lat,
          lng: hit.lng,
          radiusMiles: get().area.radiusMiles || 8,
        };
        set({ area });
        return { ok: true, area };
      },
      setRadius: (miles) => set({ area: { ...get().area, radiusMiles: miles } }),
      setFilters: (partial) => set({ filters: { ...get().filters, ...partial } }),
      resetFilters: () => set({ filters: defaultFilters }),
      setRolePref: (rolePref) => set({ rolePref }),
      markSeenSplash: () => set({ seenSplash: true }),
    }),
    { name: "truckit-area" },
  ),
);
