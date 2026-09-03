"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createAmbassador, type CreateAmbassadorState } from "@/lib/actions/admin";
import type { PilotAreaOption } from "@/lib/data/queries/admin";

const initialState: CreateAmbassadorState = { error: null, ok: false };

export function CreateAmbassadorForm({ pilotAreas }: { pilotAreas: PilotAreaOption[] }) {
  const [state, formAction, pending] = useActionState(createAmbassador, initialState);

  if (state.ok) {
    return (
      <div className="rounded-xl border border-safe/30 bg-safe/10 p-4 text-sm">
        <p className="font-medium text-safe">Ambassador account created.</p>
        <p className="mt-2 text-foreground/70">
          Share these sign-in details once — they won&apos;t be shown again. The ambassador should
          change the password after first login at <span className="font-mono">/login</span>.
        </p>
        <dl className="mt-2 space-y-1 font-mono text-xs">
          <div>
            <dt className="inline text-foreground/50">email: </dt>
            <dd className="inline">{state.email}</dd>
          </div>
          <div>
            <dt className="inline text-foreground/50">password: </dt>
            <dd className="inline">{state.tempPassword}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <div>
        <label className="text-xs font-medium text-foreground/60" htmlFor="fullName">
          Full name
        </label>
        <input
          id="fullName"
          name="fullName"
          required
          className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground/60" htmlFor="phoneE164">
          Phone number
        </label>
        <input
          id="phoneE164"
          name="phoneE164"
          type="tel"
          placeholder="+254712345678"
          required
          className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-foreground/60" htmlFor="pilotAreaId">
          Pilot area
        </label>
        <select
          id="pilotAreaId"
          name="pilotAreaId"
          required
          className="mt-1 w-full rounded-lg border border-border bg-background p-2 text-sm focus:border-brand-500 focus:outline-none"
        >
          {pilotAreas.map((area) => (
            <option key={area.id} value={area.id}>
              {area.name}
            </option>
          ))}
        </select>
      </div>
      {state.error && <p className="text-xs text-verified">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Creating…" : "Add ambassador"}
      </Button>
    </form>
  );
}
