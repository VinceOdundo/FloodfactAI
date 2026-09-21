"use client";

import { useState } from "react";
import { Signal, Wifi, WifiOff, MapPin, CheckCircle2, Info } from "lucide-react";

export function FieldStatusBar({ wardName }: { wardName?: string }) {
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="space-y-2">
      {/* Status Bar */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-3.5 py-2 text-xs text-foreground/70">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-foreground">{wardName ?? "Mukuru kwa Reuben"}</span>
          <span className="text-foreground/30">·</span>
          <span className="text-safe flex items-center gap-1 font-medium">
            <Wifi className="h-3 w-3" /> PWA Sync Ready
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
        >
          <Info className="h-3.5 w-3.5" />
          <span>Depth Guide</span>
        </button>
      </div>

      {/* Quick Depth Reference Modal / Drawer */}
      {showGuide && (
        <div className="rounded-xl border border-brand-500/20 bg-brand-50/70 p-3 text-xs text-brand-950">
          <p className="font-semibold">Field Water-Depth Reference:</p>
          <div className="mt-1.5 grid grid-cols-4 gap-2 text-center text-[11px]">
            <div className="rounded-md bg-surface p-1.5 border border-border">
              <p className="font-bold text-foreground">Ankle</p>
              <p className="text-foreground/60">~15 cm</p>
            </div>
            <div className="rounded-md bg-surface p-1.5 border border-border">
              <p className="font-bold text-amber-700">Knee</p>
              <p className="text-foreground/60">~45 cm</p>
            </div>
            <div className="rounded-md bg-surface p-1.5 border border-border">
              <p className="font-bold text-orange-700">Waist</p>
              <p className="text-foreground/60">~90 cm</p>
            </div>
            <div className="rounded-md bg-surface p-1.5 border border-border">
              <p className="font-bold text-verified">Chest+</p>
              <p className="text-foreground/60">&gt; 120 cm</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
