import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ClassificationBadge } from "@/components/classification-badge";
import { QuickLogForm } from "@/components/ambassador/quick-log-form";
import { getAmbassadorQueue } from "@/lib/data/queries/ambassador";

const STATUS_LABEL: Record<string, string> = {
  pending: "New",
  processing: "Checking now",
  classified: "Classified",
  escalated: "Needs your input",
  resolved: "Resolved",
};

export default async function AmbassadorQueuePage() {
  const queue = await getAmbassadorQueue();
  const needsAttention = queue.filter((r) => r.status === "escalated");
  const rest = queue.filter((r) => r.status !== "escalated");

  return (
    <div className="space-y-6">
      <QuickLogForm />

      {needsAttention.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-elevated">Needs your input</h2>
          <div className="mt-2 space-y-2">
            {needsAttention.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Recent reports in your area</h2>
        <div className="mt-2 space-y-2">
          {rest.map((r) => (
            <ReportCard key={r.id} report={r} />
          ))}
          {rest.length === 0 && <p className="text-sm text-foreground/50">Nothing else right now.</p>}
        </div>
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: Awaited<ReturnType<typeof getAmbassadorQueue>>[number] }) {
  return (
    <Link href={`/ambassador/cases/${report.id}`}>
      <Card className="active:bg-surface-muted">
        <div className="flex items-center justify-between gap-2">
          {report.classification ? (
            <ClassificationBadge classification={report.classification.classification} />
          ) : (
            <span className="text-xs font-semibold uppercase text-foreground/50">{STATUS_LABEL[report.status]}</span>
          )}
          <span className="text-xs text-foreground/40">{new Date(report.createdAt).toLocaleTimeString()}</span>
        </div>
        <p className="mt-2 line-clamp-2 text-sm">{report.rawText}</p>
      </Card>
    </Link>
  );
}
