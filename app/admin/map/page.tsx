import { LiveMap } from "@/components/admin/live-map";
import { getPilotAreaMapPoints, getHistoricalFloodEvents } from "@/lib/data/queries/admin";

export default async function AdminMapPage() {
  const [points, historicalEvents] = await Promise.all([getPilotAreaMapPoints(true), getHistoricalFloodEvents()]);
  const active = points.filter((p) => p.isActivePilot);
  const reference = points.filter((p) => !p.isActivePilot);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">GIS Map</h1>
        <p className="mt-1 text-sm text-foreground/60">
          {active.length} active pilot boundar{active.length === 1 ? "y" : "ies"} · {reference.length} reference
          area{reference.length === 1 ? "" : "s"} · {historicalEvents.length} historical incident
          {historicalEvents.length === 1 ? "" : "s"} — real geometry from pilot_areas.boundary, not
          illustrative pins.
        </p>
      </div>
      <LiveMap points={points} historicalEvents={historicalEvents} />
    </div>
  );
}
