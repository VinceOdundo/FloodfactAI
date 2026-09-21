import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ClassificationBadge } from "@/components/classification-badge";
import { QuickLogForm } from "@/components/ambassador/quick-log-form";
import { FieldStatusBar } from "@/components/ambassador/field-status-bar";
import { getAmbassadorQueue } from "@/lib/data/queries/ambassador";
import { getSession } from "@/lib/auth/session";

const STATUS_LABEL: Record<string, string> = {
  pending: "New",
  processing: "Checking now",
  classified: "Classified",
  escalated: "Needs your input",
  resolved: "Resolved",
};

export default async function AmbassadorQueuePage() {
  const [queue, session] = await Promise.all([getAmbassadorQueue(), getSession()]);
  const needsAttention = queue.filter((r) => r.status === "escalated");
  const rest = queue.filter((r) => r.status !== "escalated");

  return (
    <div className="space-y-5">
      <FieldStatusBar wardName={session?.pilotAreaName ?? "Mukuru kwa Reuben"} />
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
    <Link href={`/ambassador/cases/${report.id}`} className="block">
      <Card className="p-4 transition-all hover:border-brand-500/50 hover:shadow-xs active:bg-surface-muted/50">
        <div className="flex items-center justify-between gap-2">
          {report.classification ? (
            <ClassificationBadge classification={report.classification.classification} />
          ) : (
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-2xs font-semibold uppercase text-foreground/60">
              {STATUS_LABEL[report.status]}
            </span>
          )}
          <span className="text-2xs text-foreground/50">{new Date(report.createdAt).toLocaleTimeString()}</span>
        </div>
        <p className="mt-2.5 line-clamp-2 text-sm font-medium leading-relaxed text-foreground">
          &ldquo;{report.rawText}&rdquo;
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-2xs text-foreground/50">
          <span className="capitalize">{report.hazardType.replace(/_/g, " ")}</span>
          <span className="font-semibold text-brand-600">Review &amp; Log →</span>
        </div>
      </Card>
    </Link>
  );
}
