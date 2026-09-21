import Link from "next/link";
import type { ReactNode } from "react";
import { Code2, Phone, ShieldCheck, ExternalLink, MapPin } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/header";
import { Logomark } from "@/components/brand/logo";
import { WhatsAppLogo } from "@/components/brand/whatsapp-logo";

const FOOTER_NAV = {
  "Early Warning": [
    { href: "/report", label: "Report a Flood or Rumour" },
    { href: "/alerts", label: "Verified Alerts Feed" },
    { href: "/#how-it-works", label: "4-Tier Cross-Check Engine" },
    { href: "/blog/flood-safety-basics", label: "Community Flood Safety" },
  ],
  "Pilot Communities": [
    { href: "/#pilot-wards", label: "Mukuru kwa Reuben Pilot" },
    { href: "/#pilot-wards", label: "Mukuru kwa Njenga Pilot" },
    { href: "/login", label: "Youth Ambassador Portal" },
    { href: "/login", label: "Admin Mission Control" },
  ],
  "System & Code": [
    { href: "https://github.com/VinceOdundo/FloodfactAI", label: "Source Code on GitHub", external: true },
    { href: "https://github.com/VinceOdundo/FloodfactAI/blob/main/docs/ARCHITECTURE.md", label: "System Architecture", external: true },
    { href: "https://github.com/VinceOdundo/FloodfactAI/blob/main/docs/DATA_SOURCES.md", label: "Telemetry & Data Sources", external: true },
    { href: "/blog/how-classification-works", label: "How AI Classification Works" },
  ],
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketingHeader />
      <main className="flex-1">{children}</main>

      <footer className="relative overflow-hidden border-t border-border/80 bg-brand-950 text-cream">
        {/* Top Callout Strip: WhatsApp Early Warning & Direct Intake */}
        <div className="border-b border-cream-dim/15 bg-brand-900/50">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-xs">
                <WhatsAppLogo className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-cream">
                  Mukuru Flood & Rumour Verification on WhatsApp
                </p>
                <p className="text-xs text-cream-dim">
                  Forward voice notes, photos, or text messages for immediate AI + ground-truth cross-checking.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/254700000000?text=Hello%20FloodFact%2C%20I%20want%20to%20check%20a%20flood%20report"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-brand-950 transition-transform duration-150 hover:scale-105 shadow-sm"
            >
              <WhatsAppLogo className="h-4 w-4" />
              <span>Verify on WhatsApp</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-12 sm:px-6">
          {/* Brand & Mission Column */}
          <div className="sm:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 font-serif text-xl font-semibold text-cream">
              <Logomark className="h-8 w-8 shrink-0" />
              <span>FloodFact <span className="text-sage font-sans text-xs uppercase tracking-widest font-bold ml-0.5">AI</span></span>
            </Link>
            <p className="mt-3 text-xs leading-relaxed text-cream-dim">
              Community-centered, multi-source flood early warning and rumour debunking for informal settlements in Nairobi. Designed for zero false alarms and sub-second citizen verification.
            </p>

            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-cream-dim/15 bg-cream/5 p-3 text-2xs text-cream-dim">
              <div className="flex items-center gap-2 text-cream font-medium">
                <MapPin className="h-3.5 w-3.5 text-sage" />
                <span>Phase 1 Pilot Wards:</span>
              </div>
              <p className="leading-snug">Mukuru kwa Reuben & Mukuru kwa Njenga (Nairobi City County, Kenya)</p>
            </div>

            {/* Emergency Hotline Badges */}
            <div className="mt-4 space-y-1.5 text-2xs text-cream-dim">
              <p className="font-semibold uppercase tracking-wider text-cream/70 text-3xs">Emergency Dispatch Lines</p>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href="tel:1199"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cream-dim/20 bg-cream/5 px-2.5 py-1 text-cream hover:bg-cream/10"
                >
                  <Phone className="h-3 w-3 text-sage" />
                  <span>Red Cross: <strong>1199</strong></span>
                </a>
                <a
                  href="tel:0202222181"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-cream-dim/20 bg-cream/5 px-2.5 py-1 text-cream hover:bg-cream/10"
                >
                  <Phone className="h-3 w-3 text-sage" />
                  <span>Disaster Ops: <strong>020-2222181</strong></span>
                </a>
              </div>
            </div>
          </div>

          {/* Navigation Link Columns */}
          <div className="grid grid-cols-2 gap-8 sm:col-span-8 sm:grid-cols-3">
            {Object.entries(FOOTER_NAV).map(([heading, links]) => (
              <div key={heading} className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-cream/90">{heading}</p>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      {"external" in link && link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-cream-dim transition-colors hover:text-cream"
                        >
                          <span>{link.label}</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                        </a>
                      ) : (
                        <Link href={link.href} className="text-xs text-cream-dim transition-colors hover:text-cream">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Grounded Bottom Bar */}
        <div className="border-t border-cream-dim/15 bg-brand-950/80 px-4 py-5 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-center text-xs text-cream-dim/60 sm:flex-row sm:text-left">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-safe shrink-0" />
              <span>Citizen Privacy Guaranteed: Raw citizen phone numbers are HMAC hashed; never published.</span>
            </div>
            <div className="flex items-center gap-4 text-2xs">
              <span>SDG 11 (Resilient Cities)</span>
              <span>·</span>
              <span>SDG 13 (Climate Action)</span>
              <span>·</span>
              <a
                href="https://github.com/VinceOdundo/FloodfactAI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-cream"
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Open Source</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
