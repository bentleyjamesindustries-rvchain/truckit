import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SYRACUSE, areaFromCity, cityById, geocodeArea, nearestCity } from "./geo";
import type { Area, CatalogFilters, UserRole } from "./types";

type AreaState = {
  area: Area;
  filters: CatalogFilters;
  rolePref: UserRole;
  seenSplash: boolean;
  setArea: (area: Area) => void;
  setCityId: (cityId: string) => void;
  applyQuery: (query: string) => { ok: true; area: Area } | { ok: false };
  locate: (lat: number, lng: number) => Area;
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
      area: SYRACUSE,
      filters: defaultFilters,
      rolePref: "consumer",
      seenSplash: false,
      setArea: (area) => set({ area }),
      setCityId: (cityId) => {
        const city = cityById(cityId);
        if (!city) return;
        set({ area: areaFromCity(city, get().area.radiusMiles || 12) });
      },
      applyQuery: (query) => {
        const hit = geocodeArea(query);
        if (!hit) return { ok: false };
        const area = areaFromCity(hit, get().area.radiusMiles || 12);
        set({ area });
        return { ok: true, area };
      },
      locate: (lat, lng) => {
        const area = areaFromCity(nearestCity(lat, lng), get().area.radiusMiles || 12);
        set({ area });
        return area;
      },
      setRadius: (miles) => set({ area: { ...get().area, radiusMiles: miles } }),
      setFilters: (partial) => set({ filters: { ...get().filters, ...partial } }),
      resetFilters: () => set({ filters: defaultFilters }),
      setRolePref: (rolePref) => set({ rolePref }),
      markSeenSplash: () => set({ seenSplash: true }),
    }),
    {
      name: "truckit-area-v2",
      merge: (persisted, current) => {
        const p = persisted as Partial<AreaState> | undefined;
        const area = p?.area;
        if (!area?.cityId || !area.stateCode) {
          return { ...current, ...p, area: SYRACUSE };
        }
        return { ...current, ...p, area };
      },
    },
  ),
);
