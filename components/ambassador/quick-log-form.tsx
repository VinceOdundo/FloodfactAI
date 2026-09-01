"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { submitObservation } from "@/lib/actions/ambassador";

type Mode = "closed" | "households" | "water";

const initialState = { error: null, ok: false };

export function QuickLogForm() {
  const [mode, setMode] = useState<Mode>("closed");
  const [state, formAction, pending] = useActionState<{ error: string | null; ok: boolean }, FormData>(
    submitObservation,
    initialState
  );

  if (mode === "closed") {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" variant="outline" onClick={() => setMode("households")}>
          Log households reached
        </Button>
        <Button size="lg" variant="outline" onClick={() => setMode("water")}>
          Log water level
        </Button>
      </div>
    );
  }

  if (state.ok) {
    return (
      <div className="rounded-xl border border-safe/30 bg-safe/10 p-4 text-center">
        <p className="font-medium text-safe">Logged. Thank you.</p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={() => setMode("closed")}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <input type="hidden" name="observationType" value={mode === "households" ? "household_reached" : "water_level"} />
      <label className="block text-sm font-medium">
        {mode === "households" ? "How many households did you reach?" : "Water level, in centimeters"}
      </label>
      <input
        name="measurement"
        type="number"
        required
        min={0}
        inputMode="numeric"
        className="w-full rounded-xl border border-border bg-surface p-3 text-lg focus:border-brand-500 focus:outline-none"
      />
      <textarea
        name="notes"
        placeholder="Notes (optional)"
        rows={2}
        className="w-full rounded-xl border border-border bg-surface p-2 text-sm focus:border-brand-500 focus:outline-none"
      />
      {state.error && <p className="text-sm text-verified">{state.error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setMode("closed")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
