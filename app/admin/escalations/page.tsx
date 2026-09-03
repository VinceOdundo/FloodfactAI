import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { TriangleAlert, CheckCircle2, Inbox, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ResolveEscalationForm } from "@/components/admin/resolve-escalation-form";
import { listEscalations } from "@/lib/data/queries/admin";
import { isEscalationBreached } from "@/lib/core/escalation-sla";
import { cn } from "@/lib/utils";

export default async function EscalationsPage() {
  const escalations = await listEscalations();
  const open = escalations.filter((e) => e.status !== "resolved");
  const resolved = escalations.filter((e) => e.status === "resolved");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Escalations</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Cases the risk engine could not confidently classify — insufficient or conflicting evidence,
          routed to a human rather than guessed.
        </p>
      </div>

      <div className="space-y-3">
        {open.map((e) => {
          const breached = isEscalationBreached(e.createdAt);
          return (
          <Card key={e.id}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase text-elevated">
                <TriangleAlert className="h-3.5 w-3.5" />
                {e.status.replace("_", " ")}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  breached ? "font-semibold text-verified" : "text-foreground/40"
                )}
                title={new Date(e.createdAt).toLocaleString()}
              >
                <Clock className="h-3 w-3" />
                open {formatDistanceToNowStrict(new Date(e.createdAt))}
              </span>
            </div>
            <p className="mt-2 text-sm">{e.reason}</p>
            <Link href={`/admin/reports/${e.reportId}`} className="mt-1 inline-block text-xs text-brand-500 hover:underline">
              View source report →
            </Link>
            <ResolveEscalationForm escalationId={e.id} />
          </Card>
          );
        })}
        {open.length === 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-6 text-sm text-foreground/50">
            <Inbox className="h-4 w-4" />
            No open escalations.
          </div>
        )}
      </div>

      {resolved.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Resolved</h2>
          <div className="mt-2 space-y-2">
            {resolved.map((e) => (
              <Card key={e.id} className="opacity-60">
                <p className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                  {e.reason}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
