"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";

export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-foreground/70"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <button aria-label="Close menu" className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
          <div className="w-64 border-l border-border bg-background p-4">
            <p className="mb-6 font-serif text-sm font-semibold tracking-wide text-sage">FloodFact · Ops</p>
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
