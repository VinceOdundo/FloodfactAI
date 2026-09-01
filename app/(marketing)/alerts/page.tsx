import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { ClassificationBadge } from "@/components/classification-badge";
import { getPublicAlertFeed } from "@/lib/data/queries/public";
import { isDemoMode } from "@/lib/config/env";

export const metadata: Metadata = { title: "Verified Alerts" };

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function AlertsPage() {
  const alerts = await getPublicAlertFeed();

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-2xl font-bold">Verified alerts</h1>
      <p className="mt-2 text-foreground/70">
        Every alert here has been cross-checked against real rainfall, flood-risk and historical data before
        publication. False-information corrections are sent directly to whoever reported them, not listed
        here, so debunked rumours aren&apos;t given a second life.
      </p>
      {isDemoMode() && (
        <p className="mt-3 inline-block rounded-full bg-elevated-bg px-3 py-1 text-xs font-semibold text-elevated">
          Sandbox demo data
        </p>
      )}

      <div className="mt-8 space-y-3">
        {alerts.length === 0 && (
          <p className="text-sm text-foreground/60">No active alerts right now — that&apos;s good news.</p>
        )}
        {alerts.map((alert) => (
          <Card key={alert.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <ClassificationBadge classification={alert.classification} />
                {alert.pilotAreaName && <span className="ml-2 text-sm font-medium">{alert.pilotAreaName}</span>}
              </div>
              <span className="shrink-0 text-xs text-foreground/50">{formatRelativeTime(alert.createdAt)}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">{alert.messageEn}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
