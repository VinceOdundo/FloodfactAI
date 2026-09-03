"use client";

import { useEffect, useRef, useState } from "react";
import { GeoJSONSource, MapLibreMap, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { PublicPilotAreaBoundary } from "@/lib/data/queries/public";

// Same multi-provider basemap + graceful fallback pattern as
// components/admin/live-map.tsx — see that file for why (real street-level
// styles, not MapLibre's bare demo outline, raced across two independent
// providers so one being blocked/down doesn't take the map with it). This is
// the public, non-operational counterpart: real ward boundaries
// (supabase/migrations/20260902000100_real_pilot_area_boundaries.sql), no
// classification/escalation status (that stays admin-only).
const BASEMAP_STYLES = [
  "https://tiles.openfreemap.org/styles/positron",
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
];
const STYLE_PROBE_TIMEOUT_MS = 6000;
const STYLE_LOAD_TIMEOUT_MS = 15000;
const SOURCE_ID = "public-pilot-area-boundaries";
const BRAND_FILL = "#0f6f73";

async function pickReachableStyle(): Promise<string> {
  const probe = async (url: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), STYLE_PROBE_TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(String(res.status));
      return url;
    } finally {
      clearTimeout(timer);
    }
  };
  try {
    return await Promise.any(BASEMAP_STYLES.map(probe));
  } catch {
    return BASEMAP_STYLES[0];
  }
}

function boundaryFeatureCollection(areas: PublicPilotAreaBoundary[]) {
  return {
    type: "FeatureCollection" as const,
    features: areas
      .filter((a) => a.boundary && a.boundary.length >= 4)
      .map((a) => ({
        type: "Feature" as const,
        properties: { name: a.name },
        geometry: { type: "Polygon" as const, coordinates: [a.boundary as [number, number][]] },
      })),
  };
}

export function PilotAreasMap({ areas }: { areas: PublicPilotAreaBoundary[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [basemapFailed, setBasemapFailed] = useState(false);
  // Flips once the map instance exists (after the async reachability probe
  // resolves) — the boundary-sync effect below keys off this too, since
  // basemapFailed can stay false the whole time and wouldn't otherwise
  // re-trigger it once the (previously nonexistent) map instance shows up.
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let failTimer: ReturnType<typeof setTimeout> | undefined;

    pickReachableStyle().then((styleUrl) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const center: [number, number] = areas.length ? [areas[0].lon, areas[0].lat] : [36.8676, -1.3086];
      const map = new MapLibreMap({
        container: containerRef.current,
        style: styleUrl,
        center,
        zoom: 12.4,
        interactive: true,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      setMapReady(true);

      // Only the initial style load counts toward the fallback — see
      // components/admin/live-map.tsx for why post-load errors (a single
      // dropped tile/glyph request, routine on real mobile networks) must
      // not revert an already-working map back to the list fallback.
      let hasLoaded = false;
      failTimer = setTimeout(() => {
        if (!hasLoaded) setBasemapFailed(true);
      }, STYLE_LOAD_TIMEOUT_MS);
      map.once("load", () => {
        hasLoaded = true;
        clearTimeout(failTimer);
        setBasemapFailed(false);
      });
      map.on("error", (e) => {
        console.error("Map error:", e.error);
        if (!hasLoaded) {
          clearTimeout(failTimer);
          setBasemapFailed(true);
        }
      });
    });

    return () => {
      cancelled = true;
      clearTimeout(failTimer);
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map created once
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || basemapFailed) return;

    const popup = new Popup({ closeButton: false, offset: 8 });
    const sync = () => {
      const data = boundaryFeatureCollection(areas);
      const existing = map.getSource(SOURCE_ID);
      if (existing instanceof GeoJSONSource) {
        existing.setData(data);
        return;
      }
      map.addSource(SOURCE_ID, { type: "geojson", data });
      map.addLayer({
        id: `${SOURCE_ID}-fill`,
        type: "fill",
        source: SOURCE_ID,
        paint: { "fill-color": BRAND_FILL, "fill-opacity": 0.25 },
      });
      map.addLayer({
        id: `${SOURCE_ID}-line`,
        type: "line",
        source: SOURCE_ID,
        paint: { "line-color": BRAND_FILL, "line-width": 2 },
      });
      map.on("mouseenter", `${SOURCE_ID}-fill`, (e) => {
        map.getCanvas().style.cursor = "pointer";
        const name = e.features?.[0]?.properties?.name;
        if (name) popup.setLngLat(e.lngLat).setHTML(`<strong>${name}</strong>`).addTo(map);
      });
      map.on("mouseleave", `${SOURCE_ID}-fill`, () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });
    };

    if (map.isStyleLoaded()) sync();
    else map.once("load", sync);
  }, [areas, basemapFailed, mapReady]);

  if (basemapFailed) {
    return (
      <div className="flex h-full min-h-[280px] w-full flex-col justify-center gap-2 rounded-xl border border-border bg-surface p-4">
        <p className="text-xs text-foreground/50">Map tiles unavailable on this network.</p>
        {areas.map((a) => (
          <p key={a.id} className="text-sm font-medium text-foreground">
            {a.name}
          </p>
        ))}
      </div>
    );
  }

  return <div ref={containerRef} className="h-full min-h-[280px] w-full rounded-xl border border-border" />;
}
