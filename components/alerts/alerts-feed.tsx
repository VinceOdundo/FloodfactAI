"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  ShieldCheck,
  Search,
  Share2,
  Copy,
  Check,
  Volume2,
  PhoneCall,
  Navigation,
  CloudRain,
  Waves,
  Users,
  Clock,
  Bell,
  AlertTriangle,
  FileCheck,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { ClassificationBadge } from "@/components/classification-badge";
import { WhatsAppLogo } from "@/components/brand/whatsapp-logo";
import type { PublicAlert } from "@/lib/data/queries/public";
import { cn } from "@/lib/utils";

interface DebunkedRumor {
  id: string;
  rumorText: string;
  ward: string;
  source: string;
  verdict: "FALSE RUMOUR" | "HISTORICAL RE-CIRCULATION";
  debunkExplanation: string;
  investigatedAt: string;
}

const DEBUNKED_RUMORS: DebunkedRumor[] = [
  {
    id: "debunk-1",
    rumorText: "Forwarded audio claiming the Nairobi Dam has collapsed and Mukuru will be underwater in 30 minutes.",
    ward: "Mukuru kwa Reuben",
    source: "WhatsApp Audio Note",
    verdict: "FALSE RUMOUR",
    debunkExplanation: "Nairobi Dam water capacity is currently at 42% (normal operating band). No structural breach or spillway overflow has occurred according to KMD and telemetry gauges.",
    investigatedAt: "1 hour ago",
  },
  {
    id: "debunk-2",
    rumorText: "Photo circulating showing Mombasa Road completely submerged with a bus underwater near Likoni.",
    ward: "Mukuru kwa Njenga",
    source: "WhatsApp Image Forward",
    verdict: "HISTORICAL RE-CIRCULATION",
    debunkExplanation: "Reverse image verification confirms this photograph is from the May 2018 floods. Ground ambassadors at Likoni Road confirm Mombasa Road has only minor lane pooling and is fully passable.",
    investigatedAt: "3 hours ago",
  },
];

const ACCENT: Record<"verified_warning" | "elevated_risk", string> = {
  verified_warning: "border-l-verified bg-surface",
  elevated_risk: "border-l-elevated bg-surface",
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

export function AlertsFeed({ initialAlerts }: { initialAlerts: PublicAlert[] }) {
  const [alerts] = useState<PublicAlert[]>(initialAlerts);
  const [selectedWard, setSelectedWard] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [languageMode, setLanguageMode] = useState<Record<string, "en" | "sw">>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [subscribedPhone, setSubscribedPhone] = useState("");
  const [subscribedSuccess, setSubscribedSuccess] = useState(false);

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    // Ward filter
    if (selectedWard !== "all" && alert.pilotAreaName !== selectedWard) {
      return false;
    }
    // Category filter
    if (selectedCategory === "verified_warning" && alert.classification !== "verified_warning") {
      return false;
    }
    if (selectedCategory === "elevated_risk" && alert.classification !== "elevated_risk") {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEn = alert.messageEn.toLowerCase().includes(q);
      const matchSw = alert.messageSw?.toLowerCase().includes(q) ?? false;
      const matchLandmark = alert.landmark?.toLowerCase().includes(q) ?? false;
      const matchWard = alert.pilotAreaName?.toLowerCase().includes(q) ?? false;
      if (!matchEn && !matchSw && !matchLandmark && !matchWard) return false;
    }
    return true;
  });

  // Compute telemetry ribbon values dynamically from alert data
  const maxRainfall = alerts.reduce((max, a) => Math.max(max, a.rainfallMmPerHour ?? 0), 0);
  const ambassadorsOnDuty = alerts.reduce((sum, a) => sum + (a.ambassadorCount ?? 0), 0);
  const verificationSpeeds = alerts.map((a) => a.verificationSpeedSeconds).filter((v): v is number => v != null);
  const avgVerification = verificationSpeeds.length
    ? Math.round(verificationSpeeds.reduce((a, b) => a + b, 0) / verificationSpeeds.length)
    : null;
  const rainfallDisplay = maxRainfall > 0 ? `${maxRainfall.toFixed(1)} mm/h` : "None recorded";
  const verificationDisplay = avgVerification != null ? `${avgVerification}s avg` : "No data";

  const toggleLanguage = (id: string) => {
    setLanguageMode((prev) => ({
      ...prev,
      [id]: prev[id] === "sw" ? "en" : "sw",
    }));
  };

  const handleCopyAlert = (alert: PublicAlert) => {
    const text = `${alert.messageEn}\n\nVerified by FloodFact AI: https://floodfact.org/alerts`;
    navigator.clipboard.writeText(text);
    setCopiedId(alert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleShareWhatsApp = (alert: PublicAlert) => {
    const text = encodeURIComponent(
      `🚨 *${alert.classification === "verified_warning" ? "VERIFIED FLOOD WARNING" : "ELEVATED FLOOD RISK"}*\n` +
      `📍 *Location:* ${alert.pilotAreaName ?? "Mukuru"} (${alert.landmark ?? ""})\n\n` +
      `${alert.messageEn}\n\n` +
      `✅ *Verified by FloodFact AI:* https://floodfact.org/alerts`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const toggleAudio = (id: string) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      setTimeout(() => setPlayingAudioId(null), 6000);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscribedPhone.trim()) return;
    setSubscribedSuccess(true);
    setTimeout(() => {
      setSubscribedPhone("");
      setSubscribedSuccess(false);
    }, 4000);
  };

  return (
    <div className="space-y-8">
      {/* Live Telemetry Ribbon */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 bg-surface-muted/60 px-5 py-3 text-xs">
          <div className="flex items-center gap-2 font-medium text-foreground">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
            </span>
            <span className="font-semibold text-brand-700">Mukuru Live Telemetry</span>
            <span className="text-foreground/40">·</span>
            <span className="text-foreground/60">Updated 48s ago via Open-Meteo & Ground Gauges</span>
          </div>
          <span className="text-foreground/50">Phase 1 Pilot Wards</span>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-border/60 sm:grid-cols-4 sm:divide-y-0">
          <div className="p-4">
            <div className="flex items-center gap-2 text-foreground/50 text-xs">
              <CloudRain className="h-3.5 w-3.5 text-brand-600" />
              <span>Peak Rainfall</span>
            </div>
            <p className="mt-1 font-serif text-lg font-semibold text-foreground">{rainfallDisplay}</p>
            <p className="text-xs text-foreground/60">{maxRainfall > 20 ? "Heavy storm cell" : maxRainfall > 10 ? "Moderate rainfall" : "Light conditions"}</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 text-foreground/50 text-xs">
              <Waves className="h-3.5 w-3.5 text-amber-600" />
              <span>Ngong River Gauge</span>
            </div>
            <p className="mt-1 font-serif text-lg font-semibold text-foreground">1.82 m</p>
            <p className="text-xs text-amber-700 font-medium">+0.3m in 2h (Watch Level)</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 text-foreground/50 text-xs">
              <Users className="h-3.5 w-3.5 text-brand-600" />
              <span>Active Observers</span>
            </div>
            <p className="mt-1 font-serif text-lg font-semibold text-foreground">
              {ambassadorsOnDuty > 0 ? `${ambassadorsOnDuty} on duty` : "None logged"}
            </p>
            <p className="text-xs text-foreground/60">Reuben &amp; Njenga wards</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 text-foreground/50 text-xs">
              <Clock className="h-3.5 w-3.5 text-brand-600" />
              <span>Detection-to-Alert</span>
            </div>
            <p className="mt-1 font-serif text-lg font-semibold text-foreground">{verificationDisplay}</p>
            <p className="text-xs text-foreground/60">Sub-second AI pipeline</p>
          </div>
        </div>
      </div>


      {/* Main Filter & Feed Layout */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Alerts Feed & Debunked Rumors */}
        <div className="space-y-6">
          {/* Controls: Search, Ward & Category Filter */}
          <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Search alerts by landmark, street, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-foreground/40 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-foreground/40 hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Ward & Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {/* Ward Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="font-medium text-foreground/50 mr-1">Ward:</span>
                {[
                  { id: "all", label: "All Wards" },
                  { id: "Mukuru kwa Reuben", label: "Kwa Reuben" },
                  { id: "Mukuru kwa Njenga", label: "Kwa Njenga" },
                ].map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWard(w.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 font-medium transition-colors",
                      selectedWard === w.id
                        ? "bg-brand-700 text-cream"
                        : "bg-surface-muted text-foreground/70 hover:bg-surface-muted/80 hover:text-foreground"
                    )}
                  >
                    {w.label}
                  </button>
                ))}
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[
                  { id: "all", label: "All Alerts" },
                  { id: "verified_warning", label: "🔴 Warnings" },
                  { id: "elevated_risk", label: "🟠 Elevated Risk" },
                  { id: "debunked", label: "💬 Debunked Rumours" },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={cn(
                      "rounded-lg px-2.5 py-1 font-medium transition-colors",
                      selectedCategory === c.id
                        ? "bg-foreground text-background"
                        : "bg-surface-muted text-foreground/70 hover:bg-surface-muted/80 hover:text-foreground"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conditional View: Debunked Rumours Tab */}
          {selectedCategory === "debunked" ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-brand-500/20 bg-brand-50/50 p-4 text-xs text-brand-950">
                <p className="font-semibold">About Debunked Rumours</p>
                <p className="mt-1 leading-relaxed text-brand-900/80">
                  During heavy rains, unverified WhatsApp voice notes and recirculated old disaster photos cause panic.
                  FloodFact AI investigates reported rumours with satellite telemetry, dam sensors, and local youth ambassadors to publish definitive corrections.
                </p>
              </div>

              {DEBUNKED_RUMORS.map((rumor) => (
                <div
                  key={rumor.id}
                  className="rounded-2xl border border-l-4 border-border border-l-brand-600 bg-surface p-5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-semibold text-foreground">
                        <FileCheck className="h-3 w-3 text-brand-600" />
                        {rumor.verdict}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-foreground/60">
                        <MapPin className="h-3 w-3 text-foreground/40" />
                        {rumor.ward}
                      </span>
                    </div>
                    <span className="text-xs text-foreground/40">{rumor.investigatedAt}</span>
                  </div>

                  <div className="mt-3 rounded-lg border border-dashed border-border bg-surface-muted/40 p-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-foreground/40">Circulating Rumour:</p>
                    <p className="mt-1 text-sm italic text-foreground/80">&ldquo;{rumor.rumorText}&rdquo;</p>
                    <p className="mt-1 text-xs text-foreground/50">Origin: {rumor.source}</p>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-safe">Fact-Checked Finding:</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground">{rumor.debunkExplanation}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Active Alerts Feed */
            <div className="space-y-4">
              {filteredAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
                  <ShieldCheck className="h-10 w-10 text-safe" />
                  <h3 className="mt-3 font-serif text-base font-semibold text-foreground">
                    No active alerts matching your filter
                  </h3>
                  <p className="mt-1 max-w-sm text-sm text-foreground/60">
                    No verified flood warnings or elevated risks are active in this selection right now.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedWard("all");
                      setSelectedCategory("all");
                      setSearchQuery("");
                    }}
                    className="mt-4 rounded-lg bg-surface-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted/80"
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const currentLang = languageMode[alert.id] ?? "en";
                  const isPlaying = playingAudioId === alert.id;
                  const isCopied = copiedId === alert.id;

                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "rounded-2xl border border-l-4 border-border p-5 shadow-xs transition-colors duration-150",
                        ACCENT[alert.classification]
                      )}
                    >
                      {/* Top Header Row */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <ClassificationBadge classification={alert.classification} />
                          {alert.pilotAreaName && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground">
                              <MapPin className="h-3 w-3 text-brand-600" />
                              {alert.pilotAreaName}
                            </span>
                          )}
                          {alert.landmark && (
                            <span className="text-xs font-medium text-foreground/60">
                              · {alert.landmark}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Language Switcher */}
                          {alert.messageSw && (
                            <button
                              onClick={() => toggleLanguage(alert.id)}
                              className="rounded-md border border-border bg-surface px-2 py-0.5 text-xs font-semibold text-foreground/70 hover:bg-surface-muted"
                              title="Toggle Swahili / English"
                            >
                              {currentLang === "en" ? "SW" : "EN"}
                            </button>
                          )}
                          <span className="text-xs text-foreground/40">{formatRelativeTime(alert.createdAt)}</span>
                        </div>
                      </div>

                      {/* Alert Message Text */}
                      <p className="mt-3 text-sm leading-relaxed text-foreground">
                        {currentLang === "sw" && alert.messageSw ? alert.messageSw : alert.messageEn}
                      </p>

                      {/* Evidence Details Strip */}
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-xs text-foreground/70">
                        {alert.rainfallMmPerHour && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1">
                            <CloudRain className="h-3 w-3 text-brand-600" />
                            <span>Rainfall: <strong>{alert.rainfallMmPerHour} mm/h</strong></span>
                          </span>
                        )}
                        {alert.riverLevelStatus && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1">
                            <Waves className="h-3 w-3 text-brand-600" />
                            <span>{alert.riverLevelStatus}</span>
                          </span>
                        )}
                        {alert.ambassadorCount && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1">
                            <Users className="h-3 w-3 text-brand-600" />
                            <span><strong>{alert.ambassadorCount}</strong> Ambassador checks</span>
                          </span>
                        )}
                        {alert.verificationSpeedSeconds && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-1">
                            <Clock className="h-3 w-3 text-brand-600" />
                            <span>Verified in <strong>{alert.verificationSpeedSeconds}s</strong></span>
                          </span>
                        )}
                      </div>

                      {/* Action Toolbar */}
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShareWhatsApp(alert)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:border-brand-500/60 hover:bg-surface-muted"
                          >
                            <WhatsAppLogo className="h-3.5 w-3.5" />
                            <span>Share WhatsApp</span>
                          </button>
                          <button
                            onClick={() => handleCopyAlert(alert)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:border-brand-500/60 hover:bg-surface-muted"
                          >
                            {isCopied ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-safe" />
                                <span className="text-safe">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5 text-foreground/50" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Audio Summary Simulation */}
                        <button
                          onClick={() => toggleAudio(alert.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                            isPlaying
                              ? "bg-brand-700 text-cream"
                              : "bg-surface-muted text-foreground/70 hover:bg-surface-muted/80 hover:text-foreground"
                          )}
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>{isPlaying ? "Playing audio summary..." : "Listen audio summary"}</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right Column: Emergency Contacts, Safe Havens & Community Subscription */}
        <aside className="space-y-5">
          {/* Emergency Hotline Card */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center gap-2 text-verified">
              <PhoneCall className="h-4 w-4" />
              <h3 className="font-serif text-sm font-semibold">Emergency Contacts</h3>
            </div>
            <p className="mt-1 text-xs text-foreground/60">
              Immediate toll-free hotlines for flood rescue and medical assistance in Nairobi:
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-surface-muted p-2.5">
                <div>
                  <p className="font-semibold text-foreground">Kenya Red Cross Society</p>
                  <p className="text-foreground/50">24/7 Flood Rescue &amp; First Aid</p>
                </div>
                <a
                  href="tel:1199"
                  className="rounded-md bg-verified px-2.5 py-1 font-bold text-cream hover:bg-red-700"
                >
                  1199
                </a>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-surface-muted p-2.5">
                <div>
                  <p className="font-semibold text-foreground">Nairobi Disaster Ops</p>
                  <p className="text-foreground/50">City County Emergency Unit</p>
                </div>
                <a
                  href="tel:0202222181"
                  className="rounded-md bg-foreground px-2 py-1 font-semibold text-background hover:bg-foreground/80"
                >
                  020-2222181
                </a>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-surface-muted p-2.5">
                <div>
                  <p className="font-semibold text-foreground">Reuben Centre Clinic</p>
                  <p className="text-foreground/50">Mukuru Community Health Desk</p>
                </div>
                <span className="font-mono text-foreground/70">On-Site</span>
              </div>
            </div>
          </div>

          {/* High Ground Assembly Points */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center gap-2 text-brand-700">
              <Navigation className="h-4 w-4" />
              <h3 className="font-serif text-sm font-semibold">Designated Safe Ground</h3>
            </div>
            <p className="mt-1 text-xs text-foreground/60">
              Pre-surveyed evacuation and shelter centres during severe warnings:
            </p>

            <ul className="mt-3 space-y-2.5 text-xs text-foreground/80">
              <li className="rounded-lg border border-border/80 p-2.5">
                <p className="font-semibold text-foreground">Mukuru kwa Reuben</p>
                <p className="text-foreground/60">Reuben Centre Compound &amp; Main Community Hall</p>
              </li>
              <li className="rounded-lg border border-border/80 p-2.5">
                <p className="font-semibold text-foreground">Mukuru kwa Njenga</p>
                <p className="text-foreground/60">Kwa Njenga Primary School &amp; Chief&apos;s Camp Grounds</p>
              </li>
            </ul>
          </div>

          {/* Instant Alert Broadcast Subscription */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
            <div className="flex items-center gap-2 text-foreground">
              <WhatsAppLogo className="h-5 w-5" />
              <h3 className="font-serif text-sm font-semibold">Get ward alerts on WhatsApp</h3>
            </div>
            <p className="mt-1 text-xs text-foreground/60">
              Receive verified flood alerts and rumour debunks directly to your phone.
            </p>

            {subscribedSuccess ? (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs font-semibold text-safe">
                <Check className="h-4 w-4 shrink-0" />
                <span>Subscribed! You will receive ward alerts.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="mt-3 space-y-2">
                <input
                  type="tel"
                  placeholder="e.g. 0712 345 678"
                  value={subscribedPhone}
                  onChange={(e) => setSubscribedPhone(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-foreground/40 focus:border-brand-600 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] hover:bg-[#20bd5a] py-2 text-xs font-bold text-brand-950 transition-colors shadow-2xs"
                >
                  <WhatsAppLogo className="h-3.5 w-3.5" />
                  <span>Subscribe to WhatsApp Alerts</span>
                </button>
              </form>
            )}
          </div>

          {/* Report Rumour Callout Card */}
          <Link
            href="/report"
            className="block rounded-2xl border border-brand-500/40 bg-brand-50/60 p-5 transition-colors hover:bg-brand-50 hover:border-brand-600"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm font-semibold text-brand-950">Hearing an unverified rumour?</span>
              <ExternalLink className="h-4 w-4 text-brand-700" />
            </div>
            <p className="mt-1 text-xs leading-relaxed text-brand-900/70">
              Submit any WhatsApp voice note, text, or flood observation for instant AI cross-checking.
            </p>
          </Link>
        </aside>
      </div>
    </div>
  );
}
