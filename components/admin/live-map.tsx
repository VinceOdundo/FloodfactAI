"use client";

import { useEffect, useRef, useState } from "react";
import { GeoJSONSource, MapLibreMap, Marker, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AlertTriangle, Layers } from "lucide-react";
import type { PilotAreaMapPoint, HistoricalEventPoint } from "@/lib/data/queries/admin";

// MapLibre's own hosted demo style: free, keyless, explicitly intended for
// exactly this (development/demo use). A production deployment should point
// at a proper tile provider (MapTiler, Stadia Maps, or self-hosted) instead —
// OSM's raw tile servers are not meant for production traffic. See
// docs/DATA_SOURCES.md.
const DEMO_STYLE_URL = "https://demotiles.maplibre.org/style.json";
const STYLE_LOAD_TIMEOUT_MS = 15000;
const BOUNDARY_SOURCE_ID = "pilot-area-boundaries";
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
  const mapRef = useRef<MapLibreMap | null>(null);
  const [basemapFailed, setBasemapFailed] = useState(false);
  const [showHistorical, setShowHistorical] = useState(!compact);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = points.length
      ? [points[0].lon, points[0].lat]
      : [36.8676, -1.3086];

    const map = new MapLibreMap({
      container: containerRef.current,
      style: DEMO_STYLE_URL,
      center,
      zoom: compact ? 12.2 : 12.6,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    // The basemap is a third-party network dependency — a flaky connection,
    // an ad-blocker, or a restrictive network shouldn't leave operators
    // looking at a blank box with no explanation. Fall back to a plain
    // status list, which needs nothing but the same data already fetched.
    const failTimer = setTimeout(() => setBasemapFailed(true), STYLE_LOAD_TIMEOUT_MS);
    map.once("load", () => {
      clearTimeout(failTimer);
      // The style can finish loading after the timeout already fired on a slow
      // connection — recover into the real map instead of staying stuck on the
      // fallback for the rest of the session.
      setBasemapFailed(false);
    });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once; layers/markers are synced in separate effects
  }, []);

  // Pilot area boundary polygons — a real GIS layer (public.pilot_areas.boundary),
  // not just centroid pins. Reference-only areas (is_active_pilot=false, e.g.
  // Kibera/Mathare) render in neutral grey: historical context, not live pilot state.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || basemapFailed) return;

    const sync = () => {
      const data = boundaryFeatureCollection(points);
      const existing = map.getSource(BOUNDARY_SOURCE_ID);
      if (existing instanceof GeoJSONSource) {
        existing.setData(data);
        return;
      }
      map.addSource(BOUNDARY_SOURCE_ID, { type: "geojson", data });
      map.addLayer({
        id: `${BOUNDARY_SOURCE_ID}-fill`,
        type: "fill",
        source: BOUNDARY_SOURCE_ID,
        paint: { "fill-color": ["get", "color"], "fill-opacity": 0.18 },
      });
      map.addLayer({
        id: `${BOUNDARY_SOURCE_ID}-line`,
        type: "line",
        source: BOUNDARY_SOURCE_ID,
        paint: { "line-color": ["get", "color"], "line-width": 1.5 },
      });
    };

    if (map.isStyleLoaded()) sync();
    else map.once("load", sync);
  }, [points, basemapFailed]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || basemapFailed) return;

    const markers: Marker[] = [];
    const addMarkers = () => {
      for (const point of points) {
        const color = point.latestClassification ? MARKER_COLOR[point.latestClassification] : "#64748b";
        const el = document.createElement("div");
        el.style.width = "16px";
        el.style.height = "16px";
        el.style.borderRadius = "50%";
        el.style.background = color;
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.3)";

        const popupHtml = `<strong>${point.name}</strong><br/>${point.latestClassification ? point.latestClassification.replace("_", " ") : "no reports yet"}${point.openEscalations > 0 ? `<br/>${point.openEscalations} open escalation(s)` : ""}`;

        const marker = new Marker({ element: el })
          .setLngLat([point.lon, point.lat])
          .setPopup(new Popup({ offset: 12 }).setHTML(popupHtml))
          .addTo(map);
        markers.push(marker);
      }

      if (showHistorical) {
        for (const event of historicalEvents) {
          const el = document.createElement("div");
          el.style.width = "14px";
          el.style.height = "14px";
          el.style.background = "#78716c";
          el.style.border = "2px solid white";
          el.style.borderRadius = "3px";
          el.style.transform = "rotate(45deg)";
          el.style.boxShadow = "0 0 0 1px rgba(0,0,0,0.25)";

          const popupHtml = `<strong>${event.locationName} — ${event.eventDate}</strong><br/><span style="opacity:0.75">${event.description.slice(0, 140)}${event.description.length > 140 ? "…" : ""}</span><br/><em style="opacity:0.6">${event.source}</em>`;

          const marker = new Marker({ element: el })
            .setLngLat([event.lon, event.lat])
            .setPopup(new Popup({ offset: 12, maxWidth: "260px" }).setHTML(popupHtml))
            .addTo(map);
          markers.push(marker);
        }
      }
    };

    if (map.isStyleLoaded()) {
      addMarkers();
    } else {
      map.once("load", addMarkers);
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [points, historicalEvents, showHistorical, basemapFailed]);

  if (basemapFailed) {
    return <StatusListFallback points={points} historicalEvents={showHistorical ? historicalEvents : []} />;
  }

  return (
    <div className="relative">
      <div ref={containerRef} className={compact ? "h-full min-h-[420px] w-full rounded-xl border border-border" : "h-full min-h-[600px] w-full rounded-xl border border-border"} />
      {!compact && (
        <div className="absolute bottom-4 left-4 rounded-lg border border-border bg-surface/95 p-3 text-xs shadow-md backdrop-blur">
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

function StatusListFallback({ points, historicalEvents }: { points: PilotAreaMapPoint[]; historicalEvents: HistoricalEventPoint[] }) {
  return (
    <div className="h-full min-h-[420px] w-full rounded-xl border border-border p-4">
      <p className="mb-3 text-xs text-foreground/50">
        Map tiles unavailable on this network — showing the same status as a list.
      </p>
      <ul className="space-y-2">
        {points.map((point) => (
          <li key={point.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-white/50"
                style={{ background: point.latestClassification ? MARKER_COLOR[point.latestClassification] : "#64748b" }}
              />
              <span className="text-sm font-medium">{point.name}</span>
              {!point.isActivePilot && <span className="text-xs text-foreground/40">reference area</span>}
            </div>
            <span className="text-xs text-foreground/60">
              {point.latestClassification ? point.latestClassification.replace(/_/g, " ") : "no reports yet"}
              {point.openEscalations > 0 ? ` · ${point.openEscalations} open` : ""}
            </span>
          </li>
        ))}
      </ul>
      {historicalEvents.length > 0 && (
        <>
          <p className="mb-2 mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/50">
            <AlertTriangle className="h-3.5 w-3.5" />
            Historical incidents
          </p>
          <ul className="space-y-2">
            {historicalEvents.map((event) => (
              <li key={event.id} className="rounded-lg bg-surface-muted px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{event.locationName}</span>
                  <span className="text-xs text-foreground/50">{event.eventDate}</span>
                </div>
                <p className="mt-1 text-xs text-foreground/60">{event.description}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
