import { Card } from "@/components/ui/card";
import { getPilotMetrics } from "@/lib/data/queries/admin";

function fmtPct(v: number | null): string {
  return v === null ? "—" : `${v}%`;
}

export default async function MetricsPage() {
  const metrics = await getPilotMetrics();

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-semibold">Pilot metrics</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Computed live from recorded reports, alerts and ambassador logs — never hand-typed demo numbers
        (see the <code className="text-xs">pilot_metrics</code> view in supabase/migrations).
      </p>

      <div className="mt-6 space-y-4">
        {metrics.map((m) => (
          <Card key={m.pilotAreaId}>
            <h2 className="font-semibold">{m.pilotAreaName}</h2>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Tile label="Reports" value={String(m.reportsTotal)} />
              <Tile label="False info rate" value={fmtPct(m.falseInformationRatePct)} />
              <Tile label="Avg. verification" value={m.avgVerificationSeconds ? `${Math.round(m.avgVerificationSeconds)}s` : "—"} />
              <Tile label="Alerts sent" value={String(m.alertsTotal)} />
              <Tile label="Alerts within 30 min" value={fmtPct(m.alertsWithin30MinPct)} />
              <Tile label="Ambassadors active" value={String(m.ambassadorsActive)} />
              <Tile label="Ambassadors trained" value={fmtPct(m.ambassadorsTrainedPct)} />
              <Tile label="Households reached" value={String(m.householdsReachedTotal)} />
            </div>
          </Card>
        ))}
        {metrics.length === 0 && <p className="text-sm text-foreground/50">No active pilot areas configured.</p>}
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-foreground/50">{label}</p>
    </div>
  );
}
