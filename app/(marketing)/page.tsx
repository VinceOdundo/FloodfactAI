import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RippleMotif } from "@/components/brand/ripple-motif";
import { getHeadlineStats } from "@/lib/data/queries/public";
import { isDemoMode } from "@/lib/config/env";

export default async function HomePage() {
  const stats = await getHeadlineStats();

  return (
    <div>
      <section className="relative overflow-hidden bg-hero-gradient pb-16 pt-16 sm:pt-20">
        <RippleMotif className="pointer-events-none absolute -right-6 top-8 h-96 w-96 opacity-80 sm:right-6 lg:right-16" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            {isDemoMode() && (
              <p className="mb-6 inline-block rounded-full border border-cream-dim/30 px-3.5 py-1.5 text-xs font-medium text-cream-dim">
                Sandbox demo — every number on this page is illustrative, not a live measurement
              </p>
            )}
            <h1 className="font-serif text-4xl leading-[1.12] font-semibold text-cream sm:text-5xl">
              Flood warnings people can trust. Rumours that stop spreading.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-cream-dim">
              FloodFact AI cross-checks every flood report and WhatsApp rumour against real rainfall,
              flood-risk, and historical data — then tells Mukuru&apos;s residents, in seconds, what&apos;s
              actually true.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
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

          <div className="relative mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-cream-dim/15 pt-8 sm:grid-cols-4">
            <Stat value={stats.pilotAreasActive} label="Active pilot areas" />
            <Stat value={stats.reportsTotal} label="Reports processed" />
            <Stat value={stats.falseInformationCaught} label="False rumours caught" />
            <Stat
              value={stats.avgVerificationSeconds ? `${Math.round(stats.avgVerificationSeconds)}s` : "—"}
              label="Avg. verification time"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">The double emergency</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-foreground/70">
          Every long-rain season, Kibera, Mathare and Mukuru face two crises at once: the flood itself,
          and the WhatsApp rumours that spread faster than any official warning.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-3xl font-bold text-verified">50%</p>
            <p className="mt-2 text-sm text-foreground/70">of Kibera households flooded in a single rainy season</p>
            <p className="mt-3 text-xs text-foreground/50">World Economic Forum</p>
          </Card>
          <Card>
            <p className="text-3xl font-bold text-elevated">72 hrs</p>
            <p className="mt-2 text-sm text-foreground/70">average delay before official alerts reached residents</p>
            <p className="mt-3 text-xs text-foreground/50">Kenya Red Cross, 2023</p>
          </Card>
          <Card>
            <p className="text-3xl font-bold text-false-info">3 in 5</p>
            <p className="mt-2 text-sm text-foreground/70">WhatsApp messages during the 2023 floods were unverified</p>
            <p className="mt-3 text-xs text-foreground/50">iHub Kenya Research</p>
          </Card>
        </div>
      </section>

      <section className="bg-brand-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">How it works</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-4">
            <Step n={1} title="Community submits" body="A resident forwards a warning, rumour, or suspicious message via WhatsApp, SMS, or a youth ambassador." />
            <Step n={2} title="AI cross-checks" body="Real rainfall, flood-risk zones, historical records, and ground-truth reports — gathered in parallel." />
            <Step n={3} title="Classified in seconds" body="A deterministic, tested decision engine — never an LLM guess — reaches a verdict with evidence attached." />
            <Step n={4} title="Alert delivered" body="WhatsApp, SMS, community notice points, and youth ambassadors carry the verified result back out." />
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Built with real partners in mind</h2>
          <p className="mt-3 text-foreground/70">
            Open-Meteo rainfall data, Esri ArcGIS flood-risk geography, Africa&apos;s Talking SMS, the Meta
            WhatsApp Cloud API, and Anthropic Claude for language understanding — every integration in this
            build is real, not a mockup.
          </p>
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

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-cream">
        {n}
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">{body}</p>
    </div>
  );
}
