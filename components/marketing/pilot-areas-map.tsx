"use client";

import { useEffect, useRef, useState } from "react";
import { GeoJSONSource, MapLibreMap, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { PublicPilotAreaBoundary } from "@/lib/data/queries/public";

// Same MapLibre demo style + graceful fallback pattern as
// components/admin/live-map.tsx — see that file for the production-tile-
// provider caveat. This is the public, non-operational counterpart: real
// ward boundaries (supabase/migrations/20260902000100_real_pilot_area_boundaries.sql),
// no classification/escalation status (that stays admin-only).
const DEMO_STYLE_URL = "https://demotiles.maplibre.org/style.json";
const STYLE_LOAD_TIMEOUT_MS = 6000;
const SOURCE_ID = "public-pilot-area-boundaries";
const BRAND_FILL = "#0f6f73";

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

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = areas.length ? [areas[0].lon, areas[0].lat] : [36.8676, -1.3086];
    const map = new MapLibreMap({
      container: containerRef.current,
      style: DEMO_STYLE_URL,
      center,
      zoom: 12.4,
      interactive: true,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    const failTimer = setTimeout(() => setBasemapFailed(true), STYLE_LOAD_TIMEOUT_MS);
    map.once("load", () => clearTimeout(failTimer));
    map.on("error", (e) => {
      console.error("Map failed to load:", e.error);
      clearTimeout(failTimer);
      setBasemapFailed(true);
    });

    return () => {
      clearTimeout(failTimer);
      map.remove();
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
  }, [areas, basemapFailed]);

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
