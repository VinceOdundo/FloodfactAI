import Link from "next/link";
import {
  MapPin,
  FileText,
  ShieldAlert,
  Clock,
  ExternalLink,
  MessageCircle,
  Smartphone,
  Globe,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClassificationBadge } from "@/components/classification-badge";
import { LiveMap } from "@/components/admin/live-map";
import { AdminQuickActions } from "@/components/admin/admin-quick-actions";
import { WhatsAppLogo } from "@/components/brand/whatsapp-logo";
import {
  listReports,
  getPilotAreaMapPoints,
  getPilotMetrics,
  listEscalations,
} from "@/lib/data/queries/admin";

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  whatsapp: { label: "WhatsApp", icon: WhatsAppLogo, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  sms: { label: "SMS", icon: Smartphone, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  web: { label: "Web Portal", icon: Globe, color: "text-sky-700", bg: "bg-sky-50 border-sky-200" },
  ambassador: { label: "Ambassador", icon: Users, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

export default async function AdminOverviewPage() {
  const [reports, mapPoints, metrics, escalations] = await Promise.all([
    listReports(15),
    getPilotAreaMapPoints(),
    getPilotMetrics(),
    listEscalations(),
  ]);

  const openEscalations = escalations.filter((e) => e.status === "open");
  const openCases = reports.filter((r) => r.status === "processing" || r.status === "pending").length;
  const totalReports = metrics.reduce((s, m) => s + m.reportsTotal, 0);
  const totalAlerts = metrics.reduce((s, m) => s + m.alertsTotal, 0);

  return (
    <div className="space-y-6">
      {/* 1. Urgent Action / Escalations Banner (if open cases exist) */}
      {openEscalations.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-verified-border bg-verified-bg/40 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-verified text-cream shadow-xs">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-verified">
                    Action Required · {openEscalations.length} Pending Case
                  </span>
                </div>
                <h3 className="font-serif text-base font-semibold text-foreground mt-0.5">
                  Citizen Rumour / Incident Escalated for Admin Decision
                </h3>
                <p className="mt-1 text-xs text-foreground/75 leading-relaxed max-w-2xl">
                  {openEscalations[0].reason} — Ground telemetry and cross-checks are ready for final broadcast or dismissal.
                </p>
              </div>
            </div>
            <Link href="/admin/escalations" className="shrink-0">
              <Button size="sm" className="h-9 gap-1.5 bg-verified hover:bg-verified/90 text-cream text-xs font-semibold shadow-xs">
                <span>Resolve Escalation</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Automated Pipeline Controls */}
      <AdminQuickActions />

      {/* 3. Primary KPI Cards with clear context */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center justify-between p-4 bg-surface shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Active Pilot Wards</p>
            <p className="mt-1.5 text-3xl font-bold font-serif text-brand-600">2</p>
            <p className="mt-1 text-2xs text-safe font-medium">● Mukuru Reuben & Njenga</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600">
            <MapPin className="h-6 w-6" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4 bg-surface shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Citizen Reports Ingested</p>
            <p className="mt-1.5 text-3xl font-bold font-serif text-foreground">{totalReports}</p>
            <p className="mt-1 text-2xs text-foreground/55">WhatsApp, SMS & Field</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
            <FileText className="h-6 w-6" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4 bg-surface shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Verified Alerts Sent</p>
            <p className="mt-1.5 text-3xl font-bold font-serif text-safe">{totalAlerts}</p>
            <p className="mt-1 text-2xs text-safe font-medium">100% on-time delivery</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-safe/10 text-safe">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4 bg-surface shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">Active Under Triage</p>
            <p className="mt-1.5 text-3xl font-bold font-serif text-elevated">{openCases}</p>
            <p className="mt-1 text-2xs text-elevated font-medium">Sub-second AI pipeline</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </Card>
      </div>

      {/* 4. Ward Situation Triage Overview (Reuben vs Njenga) */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-verified/30 bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-verified animate-ping" />
              <h3 className="font-serif font-semibold text-foreground text-sm">Mukuru kwa Reuben</h3>
            </div>
            <span className="rounded-full bg-verified/15 px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-verified">
              Verified Warning
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center text-xs">
            <div>
              <p className="text-2xs text-foreground/50 uppercase">Rainfall</p>
              <p className="font-semibold text-foreground mt-0.5">38.5 mm/hr</p>
            </div>
            <div>
              <p className="text-2xs text-foreground/50 uppercase">Ambassadors</p>
              <p className="font-semibold text-foreground mt-0.5">3 On-Site</p>
            </div>
            <div>
              <p className="text-2xs text-foreground/50 uppercase">River Status</p>
              <p className="font-semibold text-verified mt-0.5">+1.4m Breach</p>
            </div>
          </div>
          <div className="mt-2.5 text-2xs text-foreground/60 flex items-center justify-between">
            <span>Primary Focus: Kanini Road Railway Crossing</span>
            <Link href="/admin/reports" className="text-brand-600 hover:underline font-medium">View Ward Reports →</Link>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-elevated" />
              <h3 className="font-serif font-semibold text-foreground text-sm">Mukuru kwa Njenga</h3>
            </div>
            <span className="rounded-full bg-elevated-bg px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-elevated">
              Elevated Risk
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center text-xs">
            <div>
              <p className="text-2xs text-foreground/50 uppercase">Rainfall</p>
              <p className="font-semibold text-foreground mt-0.5">22.0 mm/hr</p>
            </div>
            <div>
              <p className="text-2xs text-foreground/50 uppercase">Ambassadors</p>
              <p className="font-semibold text-foreground mt-0.5">3 On-Site</p>
            </div>
            <div>
              <p className="text-2xs text-foreground/50 uppercase">Rumour State</p>
              <p className="font-semibold text-safe mt-0.5">Debunked</p>
            </div>
          </div>
          <div className="mt-2.5 text-2xs text-foreground/60 flex items-center justify-between">
            <span>Primary Focus: Simba Cool Drainage Runoff</span>
            <Link href="/admin/reports" className="text-brand-600 hover:underline font-medium">View Ward Reports →</Link>
          </div>
        </div>
      </div>

      {/* 5. GIS Map and Live Intake Stream */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left: GIS Map */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Operational GIS Boundary Map
              </h2>
            </div>
            <Link href="/admin/map" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              <span>Full GIS Map</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
          <div className="h-[440px] w-full rounded-2xl border border-border overflow-hidden shadow-xs">
            <LiveMap points={mapPoints} compact />
          </div>
        </div>

        {/* Right: Live Community Report Stream */}
        <div className="lg:col-span-5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand-600" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                Live Citizen Report Stream
              </h2>
            </div>
            <Link href="/admin/reports" className="text-xs font-semibold text-brand-600 hover:underline">
              View all ({reports.length}) →
            </Link>
          </div>

          <Card className="h-[440px] overflow-y-auto p-3.5 space-y-2.5 bg-surface/80 shadow-xs">
            {reports.map((r) => {
              const channel = CHANNEL_CONFIG[r.sourceChannel] ?? CHANNEL_CONFIG.web;
              const ChannelIcon = channel.icon;
              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-border/70 bg-surface p-3 transition-colors hover:border-brand-500/50 hover:bg-surface-muted/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-semibold ${channel.bg} ${channel.color}`}>
                      <ChannelIcon className="h-3 w-3" />
                      {channel.label}
                    </span>
                    {r.classification ? (
                      <ClassificationBadge classification={r.classification.classification} />
                    ) : (
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-2xs font-semibold uppercase text-foreground/50">
                        {r.status}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-xs text-foreground/90 font-medium leading-relaxed line-clamp-2">
                    &ldquo;{r.rawText}&rdquo;
                  </p>

                  <div className="mt-2.5 flex items-center justify-between border-t border-border/50 pt-2 text-2xs text-foreground/50">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5 text-brand-600" />
                      {r.pilotAreaName ?? "Mukuru Sector"}
                    </span>
                    <Link
                      href={`/admin/reports/${r.id}`}
                      className="font-semibold text-brand-600 hover:underline"
                    >
                      Inspect Evidence →
                    </Link>
                  </div>
                </div>
              );
            })}
            {reports.length === 0 && (
              <div className="flex h-full items-center justify-center p-8 text-center text-xs text-foreground/40">
                No citizen reports logged yet.
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
