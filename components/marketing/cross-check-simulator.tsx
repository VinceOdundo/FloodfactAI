"use client";

import { useState } from "react";
import {
  Radar,
  ShieldCheck,
  AlertTriangle,
  FileX2,
  CheckCircle2,
  ArrowRight,
  CloudRain,
  Layers,
  Database,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { WhatsAppLogo } from "@/components/brand/whatsapp-logo";

interface Scenario {
  id: string;
  label: string;
  source: string;
  rawText: string;
  ward: string;
  classification: "verified_warning" | "false_information" | "elevated_risk";
  confidence: number;
  speed: string;
  verdictTitle: string;
  verdictDescription: string;
  evidence: Array<{ label: string; detail: string; status: "match" | "hazard" | "safe" }>;
}

const SCENARIOS: Scenario[] = [
  {
    id: "sc-1",
    label: "Rising Flood",
    source: "WhatsApp Audio",
    ward: "Mukuru kwa Reuben",
    rawText: "Water is rising fast near the railway crossing in kwa Reuben, already at knee height on Kanini Road!",
    classification: "verified_warning",
    confidence: 88,
    speed: "84s",
    verdictTitle: "VERIFIED FLOOD WARNING",
    verdictDescription: "Heavy rainfall confirmed by Open-Meteo radar, location is inside Esri living atlas flood zone, and 2 ground ambassador reports corroborate rising water.",
    evidence: [
      { label: "Rainfall Telemetry", detail: "24.5 mm / 3h (Convective cell)", status: "hazard" },
      { label: "Spatial Hydrology", detail: "Inside Living Atlas high-hazard zone", status: "hazard" },
      { label: "Historical Index", detail: "2 previous flood events recorded at this point", status: "match" },
      { label: "Ambassador Truth", detail: "2 nearby ground observations corroborate", status: "match" },
    ],
  },
  {
    id: "sc-2",
    label: "Viral Dam Rumour",
    source: "WhatsApp Forward",
    ward: "Mukuru kwa Njenga",
    rawText: "Nimesikia wanasema dam imepasuka karibu na Njenga, watu wanakimbia ovyo ovyo!",
    classification: "false_information",
    confidence: 82,
    speed: "42s",
    verdictTitle: "FALSE RUMOUR CAUGHT",
    verdictDescription: "Vector embeddings match a recurring viral 'dam burst' hoax. Real dam telemetry shows normal 42% capacity with zero structural breaches.",
    evidence: [
      { label: "Rainfall Telemetry", detail: "Minimal precipitation (1.2 mm/h)", status: "safe" },
      { label: "Dam Gauge Status", detail: "42% capacity (Normal operating level)", status: "safe" },
      { label: "Voyage AI Match", detail: "98% semantic similarity to debunked rumour pattern", status: "match" },
      { label: "Ground Verification", detail: "Mukuru youth ambassadors report calm", status: "safe" },
    ],
  },
  {
    id: "sc-3",
    label: "Drainage Pooling",
    source: "SMS Report",
    ward: "Mukuru kwa Njenga",
    rawText: "Heavy rain since morning, drainage along Mombasa road blocked, water entering some structures near Simba Cool",
    classification: "elevated_risk",
    confidence: 61,
    speed: "110s",
    verdictTitle: "ELEVATED RISK / PREPARE",
    verdictDescription: "Moderate rainfall and blocked drainage culvert detected. Flooding is localized; evacuation is not yet warranted but residents should move valuables up.",
    evidence: [
      { label: "Rainfall Telemetry", detail: "14.8 mm/h (Steady rainfall)", status: "hazard" },
      { label: "Spatial Hydrology", detail: "Roadside drainage basin pooling", status: "hazard" },
      { label: "Historical Index", detail: "Seasonal pooling noted during long rains", status: "match" },
      { label: "Ambassador Truth", detail: "Drainage cleared partially by youth volunteers", status: "safe" },
    ],
  },
];

export function CrossCheckSimulator() {
  const [selectedId, setSelectedId] = useState<string>("sc-1");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const scenario = SCENARIOS.find((s) => s.id === selectedId) ?? SCENARIOS[0];

  const handleSelectScenario = (id: string) => {
    if (id === selectedId) return;
    setIsProcessing(true);
    setSelectedId(id);
    setTimeout(() => {
      setIsProcessing(false);
    }, 400);
  };

  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <Radar className="h-3.5 w-3.5 text-brand-600" />
            <span>Live Cross-Check</span>
          </div>
          <h3 className="mt-1 font-serif text-xl font-semibold text-foreground sm:text-2xl">
            How a report goes from received to verified in seconds
          </h3>
          <p className="mt-1 text-sm text-foreground/70">
            Select a real scenario from Mukuru to watch the 4-signal evidence pipeline run.
          </p>
        </div>

        {/* Scenario Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc.id)}
              className={cn(
                "rounded-xl px-3.5 py-2 text-xs font-medium transition-colors",
                selectedId === sc.id
                  ? "bg-brand-700 text-cream shadow-xs"
                  : "bg-surface-muted text-foreground/70 hover:bg-surface-muted/80 hover:text-foreground"
              )}
            >
              {sc.label}
            </button>
          ))}
        </div>
      </div>

      {/* Simulator Grid */}
      <div className="mt-6 grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Left: Input Message */}
        <div className="space-y-4 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between text-xs text-foreground/50">
              <span className="font-semibold uppercase tracking-wider">Incoming Community Signal</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground/75">
                {scenario.source.toLowerCase().includes("whatsapp") && (
                  <WhatsAppLogo className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>via {scenario.source}</span>
              </span>
            </div>
            <div className="mt-2 rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-medium leading-relaxed text-foreground">
                &ldquo;{scenario.rawText}&rdquo;
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs text-foreground/50">
                <span>Ward: <strong>{scenario.ward}</strong></span>
                <span>·</span>
                <span>Signal Status: Received</span>
              </div>
            </div>
          </div>

          {/* Verification Speed Callout */}
          <div className="flex items-center justify-between rounded-xl bg-surface-muted p-3.5 text-xs">
            <span className="text-foreground/70">Verification Pipeline SLA:</span>
            <span className="font-semibold text-brand-700">{scenario.speed} execution</span>
          </div>
        </div>

        {/* Right: Cross-Check Evidence & Final Verdict */}
        <div className="space-y-4 lg:col-span-7">
          <div className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
            Automated Evidence Signals
          </div>

          {/* 4 Signals Grid */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {scenario.evidence.map((ev, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl border border-border bg-background p-3 transition-opacity duration-200",
                  isProcessing ? "opacity-40" : "opacity-100"
                )}
              >
                <div className="flex items-center justify-between text-xs font-medium text-foreground/60">
                  <span>{ev.label}</span>
                  {ev.status === "hazard" && <span className="text-verified font-semibold">Hazard</span>}
                  {ev.status === "match" && <span className="text-brand-600 font-semibold">Corroborated</span>}
                  {ev.status === "safe" && <span className="text-safe font-semibold">Normal</span>}
                </div>
                <p className="mt-1 text-xs text-foreground font-medium">{ev.detail}</p>
              </div>
            ))}
          </div>

          {/* Final Verdict Banner */}
          <div
            className={cn(
              "rounded-2xl border p-4 transition-all duration-300",
              isProcessing ? "opacity-40" : "opacity-100",
              scenario.classification === "verified_warning" && "border-verified/40 bg-verified-bg text-verified",
              scenario.classification === "false_information" && "border-slate-300 bg-slate-100 text-slate-800",
              scenario.classification === "elevated_risk" && "border-amber-400/40 bg-amber-50 text-amber-900"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm font-bold tracking-wide">
                {scenario.verdictTitle}
              </span>
              <span className="text-xs font-semibold">
                {scenario.confidence}% Confidence
              </span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed opacity-90">
              {scenario.verdictDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
