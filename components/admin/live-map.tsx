"use client";

import { useEffect, useRef, useState } from "react";
import { MapLibreMap, Marker, NavigationControl, Popup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { PilotAreaMapPoint } from "@/lib/data/queries/admin";

// MapLibre's own hosted demo style: free, keyless, explicitly intended for
// exactly this (development/demo use). A production deployment should point
// at a proper tile provider (MapTiler, Stadia Maps, or self-hosted) instead —
// OSM's raw tile servers are not meant for production traffic. See
// docs/DATA_SOURCES.md.
const DEMO_STYLE_URL = "https://demotiles.maplibre.org/style.json";
const STYLE_LOAD_TIMEOUT_MS = 6000;

const MARKER_COLOR: Record<string, string> = {
  verified_warning: "#b91c1c",
  elevated_risk: "#b45309",
  false_information: "#475569",
};

export function LiveMap({ points }: { points: PilotAreaMapPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [basemapFailed, setBasemapFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] = points.length
      ? [points[0].lon, points[0].lat]
      : [36.8676, -1.3086];

    const map = new MapLibreMap({
      container: containerRef.current,
      style: DEMO_STYLE_URL,
      center,
      zoom: 12.5,
      attributionControl: { compact: true },
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    // The basemap is a third-party network dependency — a flaky connection,
    // an ad-blocker, or a restrictive network shouldn't leave operators
    // looking at a blank box with no explanation. Fall back to a plain
    // status list, which needs nothing but the same data already fetched.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once; markers are synced in a separate effect
  }, []);

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
    };

    if (map.isStyleLoaded()) {
      addMarkers();
    } else {
      map.once("load", addMarkers);
    }

    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [points, basemapFailed]);

  if (basemapFailed) {
    return <StatusListFallback points={points} />;
  }

  return <div ref={containerRef} className="h-full min-h-[420px] w-full rounded-xl border border-border" />;
}

function StatusListFallback({ points }: { points: PilotAreaMapPoint[] }) {
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
            </div>
            <span className="text-xs text-foreground/60">
              {point.latestClassification ? point.latestClassification.replace(/_/g, " ") : "no reports yet"}
              {point.openEscalations > 0 ? ` · ${point.openEscalations} open` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
