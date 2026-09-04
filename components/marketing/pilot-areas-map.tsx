"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PublicPilotAreaBoundary } from "@/lib/data/queries/public";

// Same Esri raster basemap as components/admin/live-map.tsx — see that file
// for why raster (plain <img> tiles, no WebGL) replaced the previous
// MapLibre GL vector-tile setup, and why Esri specifically (not CARTO,
// whose anonymous raster endpoint turned out to require an API key). This
// is the public, non-operational counterpart: real ward boundaries
// (supabase/migrations/20260902000100_real_pilot_area_boundaries.sql), no
// classification/escalation status (that stays admin-only).
const TILE_URL = "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const TILE_ATTRIBUTION = "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ";
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
  const mapRef = useRef<LeafletMap | null>(null);
  const leafletModRef = useRef<typeof import("leaflet") | null>(null);
  const boundaryLayerRef = useRef<LeafletGeoJSON | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const center: [number, number] = areas.length ? [areas[0].lat, areas[0].lon] : [-1.3086, 36.8676];
      const map = L.map(containerRef.current, { center, zoom: 12.4 });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);

      leafletModRef.current = L;
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map created once
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletModRef.current;
    if (!map || !L) return;

    boundaryLayerRef.current?.remove();
    boundaryLayerRef.current = L.geoJSON(boundaryFeatureCollection(areas), {
      style: { color: BRAND_FILL, weight: 2, fillOpacity: 0.25 },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(feature.properties?.name ?? "", { sticky: true });
      },
    }).addTo(map);
  }, [areas, mapReady]);

  return <div ref={containerRef} className="h-full min-h-[280px] w-full rounded-xl border border-border" />;
}
