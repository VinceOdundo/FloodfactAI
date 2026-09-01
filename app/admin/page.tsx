import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ClassificationBadge } from "@/components/classification-badge";
import { LiveMap } from "@/components/admin/live-map";
import { listReports, getPilotAreaMapPoints, getPilotMetrics } from "@/lib/data/queries/admin";

export default async function AdminOverviewPage() {
  const [reports, mapPoints, metrics] = await Promise.all([
    listReports(15),
    getPilotAreaMapPoints(),
    getPilotMetrics(),
  ]);

  const openCases = reports.filter((r) => r.status === "processing" || r.status === "pending").length;
  const totalReports = metrics.reduce((s, m) => s + m.reportsTotal, 0);
  const totalAlerts = metrics.reduce((s, m) => s + m.alertsTotal, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <QuickStat label="Pilot areas" value={metrics.length} />
        <QuickStat label="Reports (total)" value={totalReports} />
        <QuickStat label="Alerts sent" value={totalAlerts} />
        <QuickStat label="In progress now" value={openCases} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/60">Pilot map</h2>
            <Link href="/admin/map" className="text-xs text-brand-500 hover:underline">
              Open full GIS map →
            </Link>
          </div>
          <LiveMap points={mapPoints} compact />
        </div>
        <Card className="max-h-[420px] overflow-y-auto">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/60">Live feed</h2>
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id} className="border-b border-border pb-3 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  {r.classification ? (
                    <ClassificationBadge classification={r.classification.classification} />
                  ) : (
                    <span className="text-xs font-medium uppercase text-foreground/50">{r.status}</span>
                  )}
                  <span className="text-xs text-foreground/40">{r.sourceChannel}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm text-foreground/80">{r.rawText}</p>
                <p className="mt-1 text-xs text-foreground/40">{r.pilotAreaName ?? "unresolved location"}</p>
                <Link href={`/admin/reports/${r.id}`} className="mt-1 inline-block text-xs text-brand-500 hover:underline">
                  View details →
                </Link>
              </li>
            ))}
            {reports.length === 0 && <p className="text-sm text-foreground/50">No reports yet.</p>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="text-center">
      <p className="text-2xl font-bold text-brand-500">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-foreground/50">{label}</p>
    </Card>
  );
}
