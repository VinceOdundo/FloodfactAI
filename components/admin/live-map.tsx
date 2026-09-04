"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON, Marker as LeafletMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers } from "lucide-react";
import type { PilotAreaMapPoint, HistoricalEventPoint } from "@/lib/data/queries/admin";

// Esri's "Light Gray Canvas" basemap: free, keyless (no usage requiring an
// API key, unlike CARTO's raster tiles — see git history, that was tried
// first and silently served "API KEY REQUIRED" watermarked tiles under a
// 200 status), real street-level detail via plain <img> tiles — no WebGL
// required. The previous MapLibre GL setup depended on a working WebGL
// context, which silently breaks the whole map (not just the basemap) on
// machines/browsers where that's unavailable or disabled — VMs, locked-down
// GPU drivers, remote desktop sessions, older Android phones — exactly the
// range of devices these pilot areas' actual users and operators are on.
// Raster tiles degrade gracefully per-tile on a bad connection instead of
// an all-or-nothing failure. Esri's tile scheme is {z}/{y}/{x}, not the
// usual {z}/{x}/{y}. Already-trusted infra in this codebase — see
// lib/providers/flood-risk-arcgis/live.ts. See docs/DATA_SOURCES.md.
const TILE_URL = "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}";
const TILE_ATTRIBUTION = "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ";
const REFERENCE_FILL = "#64748b";

const MARKER_COLOR: Record<string, string> = {
  verified_warning: "#b91c1c",
  elevated_risk: "#b45309",
  false_information: "#475569",
};

function boundaryFeatureCollection(points: PilotAreaMapPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: points
      .filter((p) => p.boundary && p.boundary.length >= 4)
      .map((p) => ({
        type: "Feature" as const,
        properties: {
          color: p.isActivePilot ? (p.latestClassification ? MARKER_COLOR[p.latestClassification] : "#0c5a5e") : REFERENCE_FILL,
        },
        geometry: { type: "Polygon" as const, coordinates: [p.boundary as [number, number][]] },
      })),
  };
}

export function LiveMap({
  points,
  historicalEvents = [],
  compact = false,
}: {
  points: PilotAreaMapPoint[];
  historicalEvents?: HistoricalEventPoint[];
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  // Leaflet touches `window` at import time, so it's dynamically imported
  // client-side only (never at module scope) — the standard pattern for
  // using it under Next.js SSR. Stashed here so later effects can reuse the
  // already-loaded module instead of re-importing.
  const leafletModRef = useRef<typeof import("leaflet") | null>(null);
  const boundaryLayerRef = useRef<LeafletGeoJSON | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [showHistorical, setShowHistorical] = useState(!compact);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const center: [number, number] = points.length
        ? [points[0].lat, points[0].lon]
        : [-1.3086, 36.8676];

      const map = L.map(containerRef.current, {
        center,
        zoom: compact ? 12.2 : 12.6,
        zoomControl: !compact,
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once; layers/markers are synced in separate effects
  }, []);

  // Pilot area boundary polygons — a real GIS layer (public.pilot_areas.boundary),
  // not just centroid pins. Reference-only areas (is_active_pilot=false, e.g.
  // Kibera/Mathare) render in neutral grey: historical context, not live pilot state.
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletModRef.current;
    if (!map || !L) return;

    boundaryLayerRef.current?.remove();
    boundaryLayerRef.current = L.geoJSON(boundaryFeatureCollection(points), {
      style: (feature) => ({
        color: feature?.properties?.color ?? REFERENCE_FILL,
        weight: 1.5,
        fillOpacity: 0.18,
      }),
    }).addTo(map);
  }, [points, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletModRef.current;
    if (!map || !L) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    for (const point of points) {
      const color = point.latestClassification ? MARKER_COLOR[point.latestClassification] : "#64748b";
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 2px rgba(0,0,0,0.3)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      const popupHtml = `<strong>${point.name}</strong><br/>${point.latestClassification ? point.latestClassification.replace("_", " ") : "no reports yet"}${point.openEscalations > 0 ? `<br/>${point.openEscalations} open escalation(s)` : ""}`;
      const marker = L.marker([point.lat, point.lon], { icon }).bindPopup(popupHtml).addTo(map);
      markersRef.current.push(marker);
    }

    if (showHistorical) {
      for (const event of historicalEvents) {
        const icon = L.divIcon({
          className: "",
          html: `<div style="width:14px;height:14px;background:#78716c;border:2px solid white;transform:rotate(45deg);box-shadow:0 0 0 1px rgba(0,0,0,0.25)"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        const popupHtml = `<strong>${event.locationName} — ${event.eventDate}</strong><br/><span style="opacity:0.75">${event.description.slice(0, 140)}${event.description.length > 140 ? "…" : ""}</span><br/><em style="opacity:0.6">${event.source}</em>`;
        const marker = L.marker([event.lat, event.lon], { icon })
          .bindPopup(popupHtml, { maxWidth: 260 })
          .addTo(map);
        markersRef.current.push(marker);
      }
    }
  }, [points, historicalEvents, showHistorical, mapReady]);

  return (
    <div className="relative">
      <div ref={containerRef} className={compact ? "h-full min-h-[420px] w-full rounded-xl border border-border" : "h-full min-h-[600px] w-full rounded-xl border border-border"} />
      {!compact && (
        <div className="absolute bottom-4 left-4 z-[1000] rounded-lg border border-border bg-surface/95 p-3 text-xs shadow-md backdrop-blur">
          <p className="mb-2 flex items-center gap-1.5 font-semibold uppercase tracking-wide text-foreground/60">
            <Layers className="h-3.5 w-3.5" />
            Legend
          </p>
          <LegendRow color="#b91c1c" label="Verified Warning" />
          <LegendRow color="#b45309" label="Elevated Risk" />
          <LegendRow color="#475569" label="False Information" />
          <LegendRow color="#0c5a5e" label="Active pilot, no reports" />
          <LegendRow color="#64748b" label="Reference area (historical context)" />
          <label className="mt-2.5 flex cursor-pointer items-center gap-2 border-t border-border pt-2.5 text-foreground/70">
            <input type="checkbox" checked={showHistorical} onChange={(e) => setShowHistorical(e.target.checked)} className="h-3.5 w-3.5" />
            Historical incidents ({historicalEvents.length})
          </label>
        </div>
      )}
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5 text-foreground/70">
      <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: color }} />
      {label}
    </div>
  );
}
