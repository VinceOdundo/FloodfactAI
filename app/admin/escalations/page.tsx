import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { TriangleAlert, CheckCircle2, Inbox, Clock, ArrowRight } from "lucide-react";
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
    <div className="max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
          <TriangleAlert className="h-4 w-4" />
          <span>Human-in-the-loop Queue</span>
        </div>
        <h1 className="mt-1 font-serif text-2xl font-bold tracking-tight text-foreground">Active Escalations</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Cases the risk engine could not confidently classify: insufficient telemetry or conflicting citizen signals, routed to an operator rather than guessed.
        </p>
      </div>

      <div className="space-y-4">
        {open.map((e) => {
          const breached = isEscalationBreached(e.createdAt);
          return (
            <Card
              key={e.id}
              className={cn(
                "p-5 transition-all",
                breached
                  ? "border-red-400/60 bg-red-50/20 shadow-sm"
                  : "border-amber-400/50 bg-amber-50/15"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-semibold uppercase",
                    breached
                      ? "border-red-300 bg-red-100 text-red-800"
                      : "border-amber-300 bg-amber-100 text-amber-900"
                  )}
                >
                  <TriangleAlert className="h-3 w-3" />
                  <span>{breached ? "SLA Breached" : e.status.replace("_", " ")}</span>
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1 text-2xs",
                    breached ? "font-bold text-red-600" : "text-foreground/50"
                  )}
                  title={new Date(e.createdAt).toLocaleString()}
                >
                  <Clock className="h-3 w-3" />
                  <span>Open for {formatDistanceToNowStrict(new Date(e.createdAt))}</span>
                </span>
              </div>

              <div className="mt-3 rounded-xl border border-border/70 bg-background/80 p-3.5">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Escalation Rationale</p>
                <p className="mt-1 text-sm font-medium leading-relaxed text-foreground">{e.reason}</p>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <Link
                  href={`/admin/reports/${e.reportId}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  <span>Inspect full telemetry &amp; signals</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="mt-4 border-t border-border/60 pt-4">
                <ResolveEscalationForm escalationId={e.id} />
              </div>
            </Card>
          );
        })}
        {open.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-foreground/50">
            <Inbox className="h-6 w-6 text-foreground/30" />
            <p className="font-semibold text-foreground/70">No open escalations</p>
            <p className="text-xs">All citizen reports in Mukuru currently hold confident automated verdicts.</p>
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
