import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { ClassificationBadge } from "@/components/classification-badge";
import { getPublicAlertFeed } from "@/lib/data/queries/public";
import { isDemoMode } from "@/lib/config/env";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Verified Alerts" };

const ACCENT: Record<"verified_warning" | "elevated_risk", string> = {
  verified_warning: "border-l-verified",
  elevated_risk: "border-l-elevated",
};

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
    <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_300px] lg:gap-14">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Verified alerts</h1>
          <p className="mt-3 max-w-xl text-foreground/70">
            Every alert here has been cross-checked against real rainfall, flood-risk and historical data
            before publication. False-information corrections are sent directly to whoever reported them,
            not listed here, so debunked rumours aren&apos;t given a second life.
          </p>
          {isDemoMode() && (
            <p className="mt-3 inline-block rounded-full bg-elevated-bg px-3 py-1 text-xs font-semibold text-elevated">
              Sandbox demo data
            </p>
          )}

          <div className="mt-8 space-y-3">
            {alerts.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-6 text-sm text-foreground/60">
                <ShieldCheck className="h-5 w-5 shrink-0 text-safe" />
                No active alerts right now — that&apos;s good news.
              </div>
            )}
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "rounded-lg border border-l-4 border-border bg-surface p-5 shadow-sm",
                  ACCENT[alert.classification]
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ClassificationBadge classification={alert.classification} />
                    {alert.pilotAreaName && (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                        <MapPin className="h-3.5 w-3.5 text-foreground/40" aria-hidden="true" />
                        {alert.pilotAreaName}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-foreground/50">{formatRelativeTime(alert.createdAt)}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed">{alert.messageEn}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:pt-1">
          <div className="rounded-2xl border border-border bg-surface-muted p-5">
            <h2 className="text-sm font-semibold text-foreground">How this feed works</h2>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-foreground/70">
              <li>Only Verified Warning and Elevated Risk alerts are published here — every one has evidence attached.</li>
              <li>New alerts appear as soon as they clear classification, in the order they were issued.</li>
              <li>Alerts in your ward also go out by WhatsApp, SMS, and your local youth ambassador.</li>
            </ul>
          </div>
          <Link
            href="/report"
            className="mt-4 block rounded-2xl border border-border bg-surface p-5 text-sm font-medium text-brand-600 transition-colors hover:bg-surface-muted"
          >
            Seeing something not listed here? Report a flood or rumour →
          </Link>
        </aside>
      </div>
    </div>
  );
}
