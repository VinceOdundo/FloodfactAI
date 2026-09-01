import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ClassificationBadge } from "@/components/classification-badge";
import { RevealContactButton } from "@/components/admin/reveal-contact-button";
import { getReportDetail } from "@/lib/data/queries/admin";

export default async function ReportDetailPage(props: PageProps<"/admin/reports/[id]">) {
  const { id } = await props.params;
  const report = await getReportDetail(id);
  if (!report) notFound();

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-foreground/50">Report {report.id.slice(0, 8)}</p>
        <h1 className="mt-1 text-xl font-semibold">{report.pilotAreaName ?? "Unresolved location"}</h1>
        <p className="mt-2 text-foreground/80">{report.rawText}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-foreground/50">
          <span>Channel: {report.sourceChannel}</span>
          <span>Hazard type: {report.hazardType}</span>
          <span>Status: {report.status}</span>
          <span>{new Date(report.createdAt).toLocaleString()}</span>
        </div>
      </div>

      {report.classification && (
        <Card>
          <div className="flex items-center justify-between">
            <ClassificationBadge classification={report.classification.classification} />
            <span className="text-sm text-foreground/60">
              Confidence: {Math.round(report.classification.confidence * 100)}%
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed">{report.classification.rationaleEn}</p>
          {report.classification.insufficientEvidence && (
            <p className="mt-2 text-xs font-medium text-elevated">
              Flagged as insufficient evidence — routed for human review rather than a confident verdict.
            </p>
          )}
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/60">Evidence snapshot</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-foreground/40">
              <th className="pb-2">Source</th>
              <th className="pb-2">Quality</th>
              <th className="pb-2">Value</th>
              <th className="pb-2">Fetched</th>
            </tr>
          </thead>
          <tbody>
            {report.evidence.map((e, i) => (
              <tr key={i} className="border-t border-border">
                <td className="py-2">{e.source.replace(/_/g, " ")}</td>
                <td className="py-2 capitalize">{e.quality}</td>
                <td className="py-2">{e.numericValue ?? "—"}</td>
                <td className="py-2 text-foreground/50">{new Date(e.fetchedAt).toLocaleTimeString()}</td>
              </tr>
            ))}
            {report.evidence.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-foreground/50">
                  No evidence recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      {report.alerts.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/60">Alert delivery</h2>
          {report.alerts.map((alert) => (
            <div key={alert.id} className="mb-3 last:mb-0">
              <p className="text-sm">{alert.messageEn}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {alert.deliveries.map((d, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-surface-muted px-2 py-0.5 text-xs"
                  >
                    {d.channel}: {d.status}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground/60">Reporter contact</h2>
        <p className="mb-2 text-xs text-foreground/50">
          Phone numbers are stored separately with no default read access. Revealing one is logged to the
          audit trail.
        </p>
        <RevealContactButton reportId={report.id} />
      </Card>
    </div>
  );
}
