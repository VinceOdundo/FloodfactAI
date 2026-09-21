"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw, Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type ActionState = "idle" | "running" | "done" | "error";

export function AdminQuickActions() {
  const [sweepState, setSweepState] = useState<ActionState>("idle");
  const [sweepMsg, setSweepMsg] = useState<string | null>(null);
  const [healthState, setHealthState] = useState<ActionState>("idle");
  const [healthMsg, setHealthMsg] = useState<string | null>(null);

  const handleSweep = async () => {
    setSweepState("running");
    setSweepMsg(null);
    try {
      const res = await fetch("/api/ops/trigger?action=escalation-sweep", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok) {
        setSweepMsg(
          data.note
            ? `SLA sweep complete. ${data.note}`
            : `Sweep complete — ${data.openTotal} open, ${data.breachedTotal} breached, ${data.newlyFlagged} newly flagged.`
        );
        setSweepState("done");
      } else {
        setSweepMsg(data.error ?? "Sweep ran with issues.");
        setSweepState("error");
      }
    } catch (err) {
      setSweepMsg("Network error — sweep may not have completed.");
      setSweepState("error");
    } finally {
      setTimeout(() => {
        setSweepState("idle");
        setSweepMsg(null);
      }, 5000);
    }
  };

  const handleHealthCheck = async () => {
    setHealthState("running");
    setHealthMsg(null);
    try {
      const res = await fetch("/api/ops/trigger?action=health-check", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.ok) {
        const results: Record<string, string> = data.results ?? {};
        const totalChecked = Object.keys(results).length;
        const errors = Object.values(results).filter((v) => v === "error" || v === "down").length;
        setHealthMsg(
          data.note
            ? `Health check complete. ${data.note}`
            : `${totalChecked} sources checked${errors > 0 ? ` — ${errors} issue(s) found` : " — all clear"}.`
        );
        setHealthState(errors > 0 ? "error" : "done");
      } else {
        setHealthMsg(data.error ?? "Health check ran with issues.");
        setHealthState("error");
      }
    } catch (err) {
      setHealthMsg("Network error — health check may not have completed.");
      setHealthState("error");
    } finally {
      setTimeout(() => {
        setHealthState("idle");
        setHealthMsg(null);
      }, 5000);
    }
  };

  const SweepIcon = sweepState === "running" ? RefreshCw : sweepState === "done" ? CheckCircle2 : sweepState === "error" ? XCircle : RefreshCw;
  const HealthIcon = healthState === "running" ? Activity : healthState === "done" ? CheckCircle2 : healthState === "error" ? XCircle : Activity;

  const feedbackMsg = sweepMsg ?? healthMsg;
  const feedbackState = sweepMsg ? sweepState : healthState;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-xs">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold uppercase tracking-wider text-foreground/50">Pipeline controls:</span>
        {feedbackMsg ? (
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${
              feedbackState === "done" ? "text-safe" : feedbackState === "error" ? "text-verified" : "text-foreground/60"
            }`}
          >
            {feedbackState === "done" && <CheckCircle2 className="h-3.5 w-3.5" />}
            {feedbackState === "error" && <XCircle className="h-3.5 w-3.5" />}
            {feedbackMsg}
          </span>
        ) : (
          <span className="text-foreground/60">Trigger automated pipelines or audit telemetry:</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleSweep}
          disabled={sweepState === "running" || healthState === "running"}
          className="h-8 gap-1.5 text-xs"
        >
          <SweepIcon className={`h-3.5 w-3.5 ${sweepState === "running" ? "animate-spin" : ""}`} />
          <span>{sweepState === "running" ? "Checking SLAs..." : "Run SLA Sweep"}</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleHealthCheck}
          disabled={sweepState === "running" || healthState === "running"}
          className="h-8 gap-1.5 text-xs"
        >
          <HealthIcon className={`h-3.5 w-3.5 ${healthState === "running" ? "animate-spin" : ""}`} />
          <span>{healthState === "running" ? "Pinging APIs..." : "Ping Data Sources"}</span>
        </Button>

        <Link href="/admin/escalations">
          <Button size="sm" className="h-8 gap-1.5 text-xs bg-brand-700 hover:bg-brand-800 text-cream">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Triage Escalations</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
