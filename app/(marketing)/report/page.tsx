import type { Metadata } from "next";
import { MessageCircleMore } from "lucide-react";
import { ReportForm } from "./report-form";
import { ClassificationBadge } from "@/components/classification-badge";

export const metadata: Metadata = { title: "Report a Flood or Rumour" };

const VERDICTS = [
  {
    classification: "verified_warning" as const,
    body: "Multiple sources agree. Act now — move to higher ground, avoid the route named.",
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

          <div className="mt-4 flex gap-3 rounded-2xl border border-border bg-surface p-5">
            <MessageCircleMore className="h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground/70">
              Already on WhatsApp or SMS? Send the same message there — this system checks those too. This
              form is here for anyone who can&apos;t.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
