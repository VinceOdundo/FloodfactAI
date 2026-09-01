"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "submitting" | "done" | "error";

export function ReportForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    // Captured before the first `await`: React's SyntheticEvent does not
    // guarantee `currentTarget` stays non-null across an async boundary.
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const rawText = String(formData.get("rawText") ?? "").trim();
    const claimedLocationText = String(formData.get("claimedLocationText") ?? "").trim();
    const phoneE164 = String(formData.get("phoneE164") ?? "").trim();

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText,
          claimedLocationText: claimedLocationText || undefined,
          phoneE164: phoneE164 || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong. Please try again.");
      }
      setStatus("done");
      formEl.reset();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-safe/30 bg-safe/10 p-6 text-center">
        <p className="font-serif text-lg font-semibold text-safe">Report received.</p>
        <p className="mt-2 text-sm text-foreground/70">
          We&apos;re cross-checking it against current rainfall, flood-risk and historical data now. If you
          gave us a phone number, you&apos;ll get the result there.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => setStatus("idle")}>
          Submit another report
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="rawText" className="block text-sm font-medium">
          What are you seeing or hearing? *
        </label>
        <textarea
          id="rawText"
          name="rawText"
          required
          minLength={3}
          maxLength={2000}
          rows={4}
          placeholder="e.g. Water is rising fast near the railway crossing on Kanini Road"
          className="mt-1.5 w-full rounded-xl border border-border bg-surface p-3 text-base focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="claimedLocationText" className="block text-sm font-medium">
          Where? (street, landmark, or sub-area)
        </label>
        <input
          id="claimedLocationText"
          name="claimedLocationText"
          maxLength={200}
          placeholder="e.g. Kanini Road, Mukuru kwa Reuben"
          className="mt-1.5 w-full rounded-xl border border-border bg-surface p-3 text-base focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="phoneE164" className="block text-sm font-medium">
          Phone number (optional — to receive the verified result directly)
        </label>
        <input
          id="phoneE164"
          name="phoneE164"
          type="tel"
          placeholder="+254712345678"
          className="mt-1.5 w-full rounded-xl border border-border bg-surface p-3 text-base focus:border-brand-500 focus:outline-none"
        />
      </div>
      {status === "error" && <p className="text-sm text-verified">{errorMessage}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting…" : "Submit report"}
      </Button>
      <p className="text-xs text-foreground/50">
        Prefer WhatsApp or SMS? This same system checks messages sent there too — this form is here for
        anyone who can&apos;t.
      </p>
    </form>
  );
}
