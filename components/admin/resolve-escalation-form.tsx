"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { resolveEscalation } from "@/lib/actions/admin";

export function ResolveEscalationForm({ escalationId }: { escalationId: string }) {
  const [state, formAction, pending] = useActionState<{ error: string | null; ok: boolean }, FormData>(
    resolveEscalation,
    { error: null, ok: false }
  );

  if (state.ok) {
    return <p className="text-sm font-medium text-safe">Resolved.</p>;
  }

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="escalationId" value={escalationId} />
      <textarea
        name="resolutionNotes"
        required
        placeholder="What did you find? (required before resolving)"
        rows={2}
        className="w-full rounded-xl border border-border bg-surface p-2 text-sm focus:border-brand-500 focus:outline-none"
      />
      {state.error && <p className="text-xs text-verified">{state.error}</p>}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Resolving…" : "Mark resolved"}
      </Button>
    </form>
  );
}
