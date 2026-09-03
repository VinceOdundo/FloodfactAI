"use client";

import { useEffect, useRef, useState } from "react";
import { GeoJSONSource, MapLibreMap, Marker, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { AlertTriangle, Layers } from "lucide-react";
import type { PilotAreaMapPoint, HistoricalEventPoint } from "@/lib/data/queries/admin";

// Two independent, free, keyless basemaps — both real street-level styles
// (unlike MapLibre's own demo style, a bare global outline with no
// streets/labels, unusable for an operational map), on different
// infrastructure. If one is blocked or down for a given network, the other
// usually isn't; see pickReachableStyle below. "positron" is clean and
// low-chroma so classification-colored markers/boundaries stay the focus.
// See docs/DATA_SOURCES.md.
const BASEMAP_STYLES = [
  "https://tiles.openfreemap.org/styles/positron",
  "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
];
const STYLE_PROBE_TIMEOUT_MS = 6000;
const STYLE_LOAD_TIMEOUT_MS = 15000;

/** Races the basemap styles and returns whichever responds OK first; falls
 *  back to the first one (letting the map's own load timeout/fallback UI
 *  take over) if every provider is unreachable. */
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
  // Flips once the map instance exists (after the async basemap-reachability
  // probe below resolves) — the boundary/marker-sync effects below key off
  // this, not just [points, basemapFailed], since basemapFailed can stay
  // false the whole time and wouldn't otherwise re-trigger them once the
  // (previously nonexistent) map instance shows up.
  const [mapReady, setMapReady] = useState(false);
  const [showHistorical, setShowHistorical] = useState(!compact);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let failTimer: ReturnType<typeof setTimeout> | undefined;

    pickReachableStyle().then((styleUrl) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const center: [number, number] = points.length
        ? [points[0].lon, points[0].lat]
        : [36.8676, -1.3086];

      const map = new MapLibreMap({
        container: containerRef.current,
        style: styleUrl,
        center,
        zoom: compact ? 12.2 : 12.6,
        attributionControl: { compact: true },
      });
      map.addControl(new NavigationControl({ showCompass: false }), "top-right");
      mapRef.current = map;
      setMapReady(true);

      // The basemap is a third-party network dependency — a flaky
      // connection, an ad-blocker, or a restrictive network shouldn't leave
      // operators looking at a blank box with no explanation. Fall back to
      // a plain status list, which needs nothing but the same data already
      // fetched.
      //
      // Only the *initial* style load counts toward that fallback. Once the
      // map has loaded once, a single dropped tile or glyph request
      // (routine on the mobile networks these pilot areas actually run on)
      // fires MapLibre's "error" event too, but doesn't mean the map is
      // broken — MapLibre already retries/skips those on its own. Reacting
      // to every post-load error by nuking the whole map back to a list is
      // what made this feel permanently broken; a loaded map should stay up.
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
  }, [points, basemapFailed, mapReady]);

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
  }, [points, historicalEvents, showHistorical, basemapFailed, mapReady]);

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
