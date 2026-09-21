"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle, RefreshCw, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DataSourceHealthRow } from "@/lib/data/queries/admin";
import { cn } from "@/lib/utils";

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  ok: CheckCircle2,
  degraded: AlertTriangle,
  down: XCircle,
  unknown: HelpCircle,
  error: XCircle,
};

const LABELS: Record<string, string> = {
  open_meteo: "Open-Meteo (rainfall)",
  arcgis_flood_risk: "Esri ArcGIS (flood-risk zones)",
  river_level: "River gauge (GloFAS / Gauge)",
  llm_anthropic: "Anthropic Claude (message understanding)",
  embeddings_voyage: "Voyage AI (rumor similarity)",
  whatsapp: "WhatsApp Cloud API",
  sms_africastalking: "Africa's Talking SMS",
};

const SOURCE_LOGOS: Record<string, { src: string; alt: string }> = {
  open_meteo: { src: "/logos/open-meteo.png", alt: "Open-Meteo logo" },
  arcgis_flood_risk: { src: "/logos/esri.png", alt: "Esri ArcGIS logo" },
  sms_africastalking: { src: "/logos/africas-talking.png", alt: "Africa's Talking logo" },
  whatsapp: { src: "/logos/whatsapp.svg", alt: "WhatsApp logo" },
  llm_anthropic: { src: "/logos/anthropic-claude.svg", alt: "Anthropic Claude logo" },
  embeddings_voyage: { src: "/logos/voyage-ai.svg", alt: "Voyage AI logo" },
};

const STATUS_STYLES: Record<string, string> = {
  ok: "bg-safe/15 text-safe",
  degraded: "bg-elevated-bg text-elevated",
  down: "bg-verified-bg text-verified",
  error: "bg-verified-bg text-verified",
  unknown: "bg-surface-muted text-foreground/50",
};

export function DataSourcesView({ initialSources }: { initialSources: DataSourceHealthRow[] }) {
  const [sources, setSources] = useState(initialSources);
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const handlePingAll = async () => {
    setChecking(true);
    setStatusMessage(null);
    setHasError(false);
    try {
      const res = await fetch("/api/ops/trigger?action=health-check", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.ok) {
        const results: Record<string, string> = data.results ?? {};
        const now = new Date().toISOString();

        // Update individual source statuses from the API response
        setSources((prev) =>
          prev.map((s) => {
            const probeResult = results[s.source];
            if (!probeResult) {
              // Source not probed in this run — keep existing state
              return s;
            }
            const newStatus: DataSourceHealthRow["status"] =
              probeResult === "ok" || probeResult === "degraded" || probeResult === "down"
                ? probeResult
                : probeResult === "error"
                ? "down"
                : "unknown";
            return {
              ...s,
              status: newStatus,
              lastSuccessAt: newStatus === "ok" ? now : s.lastSuccessAt,
            };
          })
        );

        const errorCount = Object.values(results).filter((v) => v === "error" || v === "down").length;
        if (errorCount > 0) {
          setStatusMessage(`${Object.keys(results).length} sources probed — ${errorCount} issue(s) found.`);
          setHasError(true);
        } else {
          setStatusMessage(data.note ? `Probes complete. ${data.note}` : `All ${Object.keys(results).length} sources probed — status updated.`);
        }
      } else {
        setStatusMessage("Health check returned an error.");
        setHasError(true);
      }
    } catch {
      setStatusMessage("Network error — probes may not have completed.");
      setHasError(true);
    } finally {
      setChecking(false);
      setTimeout(() => {
        setStatusMessage(null);
        setHasError(false);
      }, 6000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5">
        <div className="flex items-center gap-2 text-xs">
          <Activity className="h-4 w-4 text-brand-600" />
          <span className="font-semibold text-foreground">Live Telemetry Gateway</span>
          {statusMessage && (
            <span className={cn("font-medium", hasError ? "text-verified" : "text-safe")}>
              · {statusMessage}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={handlePingAll}
          disabled={checking}
          className="h-8 gap-1.5 text-xs bg-brand-700 hover:bg-brand-800 text-cream"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          <span>{checking ? "Probing Sources..." : "Run Health Probes"}</span>
        </Button>
      </div>

      <div className="space-y-2">
        {sources.map((s) => {
          const Icon = STATUS_ICON[s.status] ?? HelpCircle;
          // Parse JSON error strings from the DB (Anthropic/WhatsApp errors come as JSON)
          let errorSummary: string | null = null;
          if (s.lastError) {
            try {
              const parsed = JSON.parse(s.lastError);
              errorSummary = parsed?.error?.message ?? s.lastError;
            } catch {
              errorSummary = s.lastError;
            }
            // Trim to first sentence for readability
            if (errorSummary && errorSummary.length > 120) {
              errorSummary = errorSummary.slice(0, 120) + "…";
            }
          }

          const logo = SOURCE_LOGOS[s.source];
          return (
            <Card key={s.source} className="flex items-start justify-between gap-3 p-3.5">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {logo ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-white p-1.5 shadow-2xs">
                    <Image
                      src={logo.src}
                      alt={logo.alt}
                      width={32}
                      height={32}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-surface-muted text-foreground/50">
                    <Activity className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{LABELS[s.source] ?? s.source}</p>
                  {errorSummary ? (
                    <p className="mt-0.5 text-xs text-verified/80 leading-snug">{errorSummary}</p>
                  ) : (
                    <p className="text-xs text-foreground/50">
                      {s.lastSuccessAt
                        ? `Last success ${new Date(s.lastSuccessAt).toLocaleTimeString()}`
                        : "No successful check recorded"}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs uppercase text-foreground/50 font-medium">
                  {s.mode}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase",
                    STATUS_STYLES[s.status] ?? STATUS_STYLES.unknown
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.status}
                </span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
