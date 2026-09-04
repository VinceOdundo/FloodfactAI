"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { submitObservation } from "@/lib/actions/ambassador";

export function ConfirmFloodingForm({ reportId }: { reportId: string }) {
  const [state, formAction, pending] = useActionState<{ error: string | null; ok: boolean }, FormData>(
    submitObservation,
    { error: null, ok: false }
  );

  if (state.ok) {
    return <p className="rounded-lg bg-safe/10 p-3 text-sm font-medium text-safe">Thanks — logged on the ground.</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Did you check this in person?</p>
      <div className="grid grid-cols-2 gap-2">
        <form action={formAction}>
          <input type="hidden" name="reportId" value={reportId} />
          <input type="hidden" name="observationType" value="visual_confirmation" />
          <input type="hidden" name="confirmed" value="true" />
          <Button type="submit" disabled={pending} className="w-full" variant="danger">
            Yes, flooding confirmed
          </Button>
        </form>
        <form action={formAction}>
          <input type="hidden" name="reportId" value={reportId} />
          <input type="hidden" name="observationType" value="visual_confirmation" />
          <input type="hidden" name="confirmed" value="false" />
          <Button type="submit" disabled={pending} className="w-full" variant="outline">
            No flooding seen
          </Button>
        </form>
      </div>
      {state.error && (
        <p role="alert" className="rounded-lg border border-verified/25 bg-verified-bg px-3 py-2.5 text-sm text-verified">
          {state.error}
        </p>
      )}
    </div>
  );
}
