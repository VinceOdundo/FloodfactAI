import Link from "next/link";
import Image from "next/image";
import { MessageCircle, Radar, ShieldCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RippleMotif } from "@/components/brand/ripple-motif";
import { SignalMotif, ContourMotif } from "@/components/brand/section-motifs";
import { WaterParticles } from "@/components/brand/water-particles";
import { Logomark } from "@/components/brand/logo";
import { PartnerLogos } from "@/components/marketing/partner-logos";
import { CrossCheckSimulator } from "@/components/marketing/cross-check-simulator";
import { PilotAreasMap } from "@/components/marketing/pilot-areas-map";
import { getHeadlineStats, getActivePilotAreaBoundaries } from "@/lib/data/queries/public";
import { isDemoMode } from "@/lib/config/env";

const STEPS = [
  { n: 1, icon: MessageCircle, title: "Community submits", body: "A resident forwards a warning, rumour, or suspicious message via WhatsApp, SMS, or a youth ambassador." },
  { n: 2, icon: Radar, title: "AI cross-checks", body: "Real rainfall, flood-risk zones, historical records, and ground-truth reports — gathered in parallel." },
  { n: 3, icon: ShieldCheck, title: "Classified in seconds", body: "A deterministic, tested decision engine — never an LLM guess — reaches a verdict with evidence attached." },
  { n: 4, icon: Send, title: "Alert delivered", body: "WhatsApp, SMS, community notice points, and youth ambassadors carry the verified result back out." },
];

export default async function HomePage() {
  const [stats, pilotAreas] = await Promise.all([getHeadlineStats(), getActivePilotAreaBoundaries()]);

  return (
    <div>
      <section className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden bg-hero-gradient pb-20 pt-28 sm:pt-24">
        <WaterParticles className="opacity-40" />
        <RippleMotif className="pointer-events-none absolute -right-10 top-1/2 hidden h-[26rem] w-[26rem] -translate-y-1/2 opacity-70 sm:block lg:right-10 lg:h-[30rem] lg:w-[30rem]" />
        <div className="relative mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-cream-dim/25 bg-cream/5 px-3.5 py-1.5 backdrop-blur-xs">
                  <Logomark className="h-4 w-4" />
                  <span className="font-serif text-xs font-semibold tracking-wide text-cream">
                    FloodFact AI · Mukuru Early Warning
                  </span>
                </div>
                {isDemoMode() && (
                  <p className="rounded-full border border-cream-dim/20 bg-cream/5 px-3 py-1 text-xs font-medium text-cream-dim">
                    Pilot preview
                  </p>
                )}
              </div>
              <h1 className="font-serif text-3xl font-semibold leading-[1.14] text-cream sm:text-5xl lg:text-6xl">
                Flood warnings people can trust. Rumours that stop spreading.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-cream-dim sm:text-lg">
                Cross-checking community flood reports and WhatsApp rumours against live rainfall,
                hydrology layers, and ground-truth in seconds.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/report">
                  <Button size="lg">Report a flood or rumour</Button>
                </Link>
                <Link href="/alerts">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-cream-dim/40 text-cream hover:bg-cream/10"
                  >
                    See verified alerts
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative lg:col-span-5">
              <div className="relative overflow-hidden rounded-2xl border border-cream-dim/20 bg-brand-900/50 shadow-2xl">
                <Image
                  src="/images/hero-community-monitoring.jpg"
                  alt="Community youth ambassador monitoring weather telemetry and river water level in Mukuru"
                  width={640}
                  height={420}
                  priority
                  className="h-auto w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-cream">
                  <div className="flex items-center gap-2 rounded-full border border-cream/20 bg-brand-950/80 px-3 py-1.5 backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Telemetry · Ngong River 1.8m</span>
                  </div>
                  <div className="rounded-full border border-cream/20 bg-brand-950/80 px-3 py-1.5 backdrop-blur-md">
                    <span>94s Avg. Verification</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-cream-dim/15 pt-8 sm:grid-cols-4">
            <Stat value={stats.pilotAreasActive} label="Active pilot areas" />
            <Stat value={stats.reportsTotal} label="Reports processed" />
            <Stat value={stats.falseInformationCaught} label="False rumours caught" />
            <Stat
              value={stats.avgVerificationSeconds ? `${Math.round(stats.avgVerificationSeconds)}s` : "Pending"}
              label="Avg. verification time"
            />
          </div>
        </div>

        <ContourMotif className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full text-cream/20 sm:h-40" />
      </section>

      <section className="flex min-h-screen flex-col justify-center px-4 py-20 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              The double emergency
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground/70">
              Every long-rain season, Kibera, Mathare and Mukuru face two crises at once: the flood itself,
              and the WhatsApp rumours that spread faster than any official warning.
            </p>
          </div>

          <div className="mt-16 grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-4">
              <Card className="p-6">
                <p className="text-4xl font-bold text-verified">50%</p>
                <p className="mt-2 text-sm text-foreground/70">of Kibera households flooded in a single rainy season</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-foreground/40">World Economic Forum</p>
              </Card>
              <Card className="p-6">
                <p className="text-4xl font-bold text-elevated">72 hrs</p>
                <p className="mt-2 text-sm text-foreground/70">average delay before official alerts reached residents</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-foreground/40">Kenya Red Cross, 2023</p>
              </Card>
              <Card className="p-6">
                <p className="text-4xl font-bold text-false-info">3 in 5</p>
                <p className="mt-2 text-sm text-foreground/70">WhatsApp messages during the 2023 floods were unverified</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-foreground/40">iHub Kenya Research</p>
              </Card>
            </div>

            <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface-muted p-8">
              <SignalMotif className="h-auto w-full max-w-sm text-brand-600" />
              <p className="mt-6 max-w-xs text-center text-sm leading-relaxed text-foreground/60">
                FloodFact AI is built to tell the two apart — reliably, in seconds, with evidence attached to
                every verdict.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-col justify-center bg-brand-50 px-4 py-20 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-brand-950 sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-brand-900/70">
              Four steps, from a resident&apos;s message to a verified, delivered answer — no manual triage
              bottleneck in between.
            </p>
          </div>

          <div className="relative mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-4">
            <div
              className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[18px] hidden border-t border-dashed border-brand-500/30 sm:block"
              aria-hidden="true"
            />
            {STEPS.map((step) => (
              <Step key={step.n} {...step} />
            ))}
          </div>

          <div className="mt-16">
            <CrossCheckSimulator />
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-col justify-center px-4 py-20 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Where we&apos;re piloting
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground/70">
              Phase 1 covers two real Nairobi wards — Mukuru kwa Reuben and Mukuru kwa Njenga —
              mapped from OpenStreetMap&apos;s administrative boundaries, not an approximation.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="h-[560px] lg:col-span-2 lg:h-[640px]">
              <PilotAreasMap areas={pilotAreas} />
            </div>
            <div className="flex flex-col justify-center gap-4">
              {pilotAreas.map((area) => (
                <div key={area.id} className="rounded-lg border border-border bg-surface p-5">
                  <p className="font-medium text-foreground">{area.name}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-foreground/50">Active Phase 1 pilot ward</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden border-t border-border bg-surface-muted/50 px-4 py-20 sm:px-6">
        <ContourMotif className="pointer-events-none absolute inset-x-0 top-0 h-28 w-full rotate-180 text-foreground/5 sm:h-40" />
        <div className="relative mx-auto w-full max-w-5xl text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built with real partners in mind
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-foreground/70">
            Every integration in this build is real, not a mockup — live data, live delivery channels, live
            language understanding.
          </p>

          <PartnerLogos />

          <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
            <Link href="/report">
              <Button size="lg">Report a flood or rumour</Button>
            </Link>
            <Link href="/alerts">
              <Button size="lg" variant="outline">
                See verified alerts
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold text-cream">{value}</p>
      <p className="mt-1 text-sm text-cream-dim">{label}</p>
    </div>
  );
}

function Step({
  n,
  icon: Icon,
  title,
  body,
}: {
  n: number;
  icon: typeof MessageCircle;
  title: string;
  body: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
      <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-cream ring-4 ring-brand-50">
        {n}
      </div>
      <Icon className="mt-4 h-5 w-5 text-brand-500" aria-hidden="true" />
      <h3 className="mt-3 text-base font-semibold text-brand-950">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-brand-900/70">{body}</p>
    </div>
  );
}
