import type { Metadata } from "next";
import { AlertsFeed } from "@/components/alerts/alerts-feed";
import { getPublicAlertFeed } from "@/lib/data/queries/public";
import { isDemoMode } from "@/lib/config/env";

export const metadata: Metadata = {
  title: "Verified Alerts & Rumour Debunks",
  description: "Live, cross-checked flood warnings and rumour verifications for Mukuru kwa Reuben and Mukuru kwa Njenga.",
};

export default async function AlertsPage() {
  const alerts = await getPublicAlertFeed();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      {/* Header Section */}
      <div className="mb-8 max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-brand-50 px-3 py-1 font-serif text-xs font-semibold text-brand-700">
            Official Community Broadcast Feed
          </span>
          {isDemoMode() && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              Live Sandbox Data
            </span>
          )}
        </div>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Verified Alerts &amp; Rumour Debunks
        </h1>
        <p className="mt-2 text-base leading-relaxed text-foreground/70">
          Every alert is cross-checked in seconds against Open-Meteo rainfall telemetry, Esri ArcGIS flood-hazard layers,
          and ground-truth reports from Mukuru&apos;s youth ambassadors.
        </p>
      </div>

      {/* Main Interactive Hub */}
      <AlertsFeed initialAlerts={alerts} />
    </div>
  );
}
