import type { Metadata } from "next";
import { ReportForm } from "./report-form";
import { ClassificationBadge } from "@/components/classification-badge";
import { WhatsAppLogo } from "@/components/brand/whatsapp-logo";

export const metadata: Metadata = { title: "Report a Flood or Rumour" };

const VERDICTS = [
  {
    classification: "verified_warning" as const,
    body: "Multiple sources agree. Act now: move to higher ground, avoid the route named.",
  },
  {
    classification: "elevated_risk" as const,
    body: "Some signals point to risk, not enough for a full warning. Monitor conditions and prepare.",
  },
  {
    classification: "false_information" as const,
    body: "Doesn't hold up against real evidence. You'll get a correction, sent directly to you.",
  },
];

export default function ReportPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Report a flood or a suspicious message
          </h1>
          <p className="mt-3 max-w-lg text-foreground/70">
            Tell us what you&apos;re seeing, or paste a message you&apos;re unsure about. We&apos;ll check it
            against current rainfall, flood-risk maps and historical records, and reply with a clear verdict.
          </p>
          <div className="mt-8 max-w-lg">
            <ReportForm />
          </div>
        </div>

        <aside className="lg:pt-1">
          <div className="rounded-2xl border border-border bg-surface-muted p-5">
            <h2 className="text-sm font-semibold text-foreground">What the verdict means</h2>
            <ul className="mt-4 space-y-4">
              {VERDICTS.map((v) => (
                <li key={v.classification}>
                  <ClassificationBadge classification={v.classification} />
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/70">{v.body}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-50/40 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <WhatsAppLogo className="h-6 w-6 shrink-0" />
              <div>
                <h3 className="font-serif text-sm font-semibold text-foreground">
                  Prefer reporting via WhatsApp?
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-foreground/70">
                  Forward any voice note, photo, or rumor directly to the FloodFact AI WhatsApp channel for instant telemetry cross-checking.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/254700000000?text=I%20have%20a%20flood%20report%20for%20Mukuru"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] py-2 text-xs font-bold text-brand-950 transition-transform duration-150 hover:scale-[1.02] shadow-2xs"
            >
              <WhatsAppLogo className="h-4 w-4" />
              <span>Send WhatsApp Report</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
