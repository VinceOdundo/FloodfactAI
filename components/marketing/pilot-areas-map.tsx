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
  const markersRef = useRef<Array<import("leaflet").Marker>>([]);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const center: [number, number] = areas.length ? [areas[0].lat, areas[0].lon] : [-1.3086, 36.8676];
      const map = L.map(containerRef.current, { center, zoom: 13, scrollWheelZoom: false });
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
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const geoJson = L.geoJSON(boundaryFeatureCollection(areas), {
      style: { color: BRAND_FILL, weight: 2.5, fillOpacity: 0.22 },
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(
          `<div style="font-family:system-ui,sans-serif;padding:1px 0"><strong>${feature.properties?.name}</strong><br/><span style="font-size:10px;opacity:0.75;text-transform:uppercase;letter-spacing:0.05em">Active Phase 1 Pilot</span></div>`,
          { sticky: true }
        );
      },
    }).addTo(map);

    boundaryLayerRef.current = geoJson;

    // Add pulsing beacon markers at each pilot ward centroid
    for (const area of areas) {
      const beaconIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:24px;height:24px;">
          <div style="position:absolute;width:24px;height:24px;border-radius:50%;background:#0f6f73;opacity:0.35;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:12px;height:12px;border-radius:50%;background:#0f6f73;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker([area.lat, area.lon], { icon: beaconIcon })
        .bindTooltip(`<strong>${area.name}</strong><br/><span style="font-size:10px;color:#0f6f73;font-weight:600">● LIVE MONITORING</span>`, { sticky: true })
        .addTo(map);
      markersRef.current.push(marker);
    }

    if (areas.length > 0 && geoJson.getBounds().isValid()) {
      map.fitBounds(geoJson.getBounds(), { padding: [40, 40], maxZoom: 14.5 });
    }
  }, [areas, mapReady]);

  return <div ref={containerRef} className="h-full min-h-[280px] w-full rounded-xl border border-border shadow-xs" />;
}
