import type { Metadata } from "next";
import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "Report a Flood or Rumour" };

export default function ReportPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Report a flood or a suspicious message</h1>
      <p className="mt-3 text-foreground/70">
        Tell us what you&apos;re seeing, or paste a message you&apos;re unsure about. We&apos;ll check it
        against current rainfall, flood-risk maps and historical records, and reply with a clear verdict —
        Verified Warning, Elevated Risk, or False Information.
      </p>
      <div className="mt-8">
        <ReportForm />
      </div>
    </div>
  );
}
