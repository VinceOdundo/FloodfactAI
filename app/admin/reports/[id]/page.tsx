import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Smartphone,
  Globe,
  Users,
  MapPin,
  Clock,
  Radio,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ClassificationBadge } from "@/components/classification-badge";
import { RevealContactButton } from "@/components/admin/reveal-contact-button";
import { WhatsAppLogo } from "@/components/brand/whatsapp-logo";
import { getReportDetail } from "@/lib/data/queries/admin";

const QUALITY_ICON: Record<string, typeof CheckCircle2> = {
  ok: CheckCircle2,
  degraded: AlertTriangle,
  unavailable: HelpCircle,
};

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  whatsapp: { label: "WhatsApp", icon: WhatsAppLogo, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  sms: { label: "SMS", icon: Smartphone, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  web: { label: "Web Portal", icon: Globe, color: "text-sky-700", bg: "bg-sky-50 border-sky-200" },
  ambassador: { label: "Ambassador", icon: Users, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

export default async function ReportDetailPage(props: PageProps<"/admin/reports/[id]">) {
  const { id } = await props.params;
  const report = await getReportDetail(id);
  if (!report) notFound();

  const channel = CHANNEL_CONFIG[report.sourceChannel] ?? CHANNEL_CONFIG.web;
  const ChannelIcon = channel.icon;

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/admin/reports" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all reports
      </Link>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-semibold ${channel.bg} ${channel.color}`}>
              <ChannelIcon className="h-3 w-3 shrink-0" />
              <span>{channel.label}</span>
            </span>
            <span className="text-2xs font-mono text-foreground/40">
              ID: {report.id.slice(0, 8)}
            </span>
          </div>
          <div className="flex items-center gap-3 text-2xs text-foreground/50">
            <span className="flex items-center gap-1 font-medium text-brand-700">
              <MapPin className="h-3 w-3" />
              {report.pilotAreaName ?? "Mukuru Sector"}
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(report.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-foreground/40">Incoming Signal Text</p>
          <p className="mt-1.5 text-base font-medium leading-relaxed text-foreground">
            &ldquo;{report.rawText}&rdquo;
          </p>
        </div>
      </div>

      {report.classification && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <ClassificationBadge classification={report.classification.classification} />
            <span className="text-xs font-semibold text-foreground/70">
              Pipeline Confidence: {Math.round(report.classification.confidence * 100)}%
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-foreground/80">{report.classification.rationaleEn}</p>
          {report.classification.insufficientEvidence && (
            <p className="mt-2.5 rounded-xl border border-amber-500/20 bg-amber-50/60 p-3 text-xs font-medium text-amber-900">
              Flagged as insufficient evidence: routed for human review rather than a confident automated verdict.
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
            {report.evidence.map((e, i) => {
              const QualityIcon = QUALITY_ICON[e.quality] ?? HelpCircle;
              return (
                <tr key={i} className="border-t border-border">
                  <td className="py-2">{e.source.replace(/_/g, " ")}</td>
                  <td className="py-2 capitalize">
                    <span className="flex items-center gap-1.5">
                      <QualityIcon className="h-3.5 w-3.5 text-foreground/50" />
                      {e.quality}
                    </span>
                  </td>
                  <td className="py-2 font-mono text-xs">{e.numericValue !== null ? e.numericValue : "N/A"}</td>
                  <td className="py-2 text-foreground/50">{new Date(e.fetchedAt).toLocaleTimeString()}</td>
                </tr>
              );
            })}
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
