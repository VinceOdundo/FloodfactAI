"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { revealContact } from "@/lib/actions/admin";

export function RevealContactButton({ reportId }: { reportId: string }) {
  const [result, setResult] = useState<string[] | null>(null);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const res = await revealContact(reportId);
    setPending(false);
    setResult("error" in res ? [res.error] : res.phones.length ? res.phones : ["No contact captured for this report."]);
  }

  if (result) {
    return <p className="text-xs text-foreground/60">{result.join(", ")}</p>;
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={pending}>
      {pending ? "Revealing…" : "Reveal contact (audited)"}
    </Button>
  );
}
