import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ResolveEscalationForm } from "@/components/admin/resolve-escalation-form";
import { listEscalations } from "@/lib/data/queries/admin";

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
        {open.map((e) => (
          <Card key={e.id}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-elevated">{e.status.replace("_", " ")}</span>
              <span className="text-xs text-foreground/40">{new Date(e.createdAt).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm">{e.reason}</p>
            <Link href={`/admin/reports/${e.reportId}`} className="mt-1 inline-block text-xs text-brand-500 hover:underline">
              View source report →
            </Link>
            <ResolveEscalationForm escalationId={e.id} />
          </Card>
        ))}
        {open.length === 0 && <p className="text-sm text-foreground/50">No open escalations.</p>}
      </div>

      {resolved.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/50">Resolved</h2>
          <div className="mt-2 space-y-2">
            {resolved.map((e) => (
              <Card key={e.id} className="opacity-60">
                <p className="text-sm">{e.reason}</p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
