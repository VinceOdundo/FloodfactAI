import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getDataSourceHealth } from "@/lib/data/queries/admin";
import { cn } from "@/lib/utils";

const STATUS_ICON: Record<string, typeof CheckCircle2> = {
  ok: CheckCircle2,
  degraded: AlertTriangle,
  down: XCircle,
  unknown: HelpCircle,
};

const LABELS: Record<string, string> = {
  open_meteo: "Open-Meteo (rainfall)",
  arcgis_flood_risk: "Esri ArcGIS (flood-risk zones)",
  river_level: "River gauge (GloFAS — not yet configured)",
  llm_anthropic: "Anthropic Claude (message understanding)",
  embeddings_voyage: "Voyage AI (rumor similarity)",
  whatsapp: "WhatsApp Cloud API",
  sms_africastalking: "Africa's Talking SMS",
};

const STATUS_STYLES: Record<string, string> = {
  ok: "bg-safe/15 text-safe",
  degraded: "bg-elevated-bg text-elevated",
  down: "bg-verified-bg text-verified",
  unknown: "bg-surface-muted text-foreground/50",
};

export default async function DataSourcesPage() {
  const sources = await getDataSourceHealth();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">Data source health</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Every evidence provider, live or sandbox. A source reads &ldquo;sandbox&rdquo; until its real credentials are
        added — see docs/SETUP.md — never presented as live data in the meantime.
      </p>
      <div className="mt-6 space-y-2">
        {sources.map((s) => {
          const Icon = STATUS_ICON[s.status] ?? HelpCircle;
          return (
            <Card key={s.source} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{LABELS[s.source] ?? s.source}</p>
                <p className="text-xs text-foreground/40">
                  {s.lastSuccessAt ? `Last success ${new Date(s.lastSuccessAt).toLocaleString()}` : "No successful check yet"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs uppercase text-foreground/50">
                  {s.mode}
                </span>
                <span className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold uppercase", STATUS_STYLES[s.status])}>
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
