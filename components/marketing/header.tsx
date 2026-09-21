"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, CloudRain, AlertTriangle, ShieldCheck, PhoneCall, ExternalLink } from "lucide-react";
import { Logomark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/alerts", label: "Verified Alerts", badge: "Live" },
  { href: "/report", label: "Report a Flood", isAction: true },
  { href: "/blog", label: "Field Notes & Blog" },
  { href: "/login", label: "Staff Login" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-cream-dim/10 bg-brand-900/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand Logo Lockup */}
        <Link
          href="/"
          className="flex items-center gap-2.5 whitespace-nowrap font-serif text-lg font-semibold tracking-tight text-cream"
        >
          <Logomark className="h-7 w-7 shrink-0" />
          <span>
            FloodFact <span className="text-sage font-sans text-xs uppercase tracking-widest font-bold">AI</span>
          </span>
        </Link>

        {/* Live Status Ticker (Desktop) */}
        <Link
          href="/alerts"
          className="hidden md:flex items-center gap-2 rounded-full border border-cream-dim/20 bg-cream/5 px-3 py-1 text-xs text-cream-dim transition-colors hover:border-cream-dim/40 hover:text-cream"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="font-medium">Mukuru Watch:</span>
          <span className="text-cream">14.8 mm/h rain · River 1.82m</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 text-sm font-medium sm:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            if (item.isAction) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="ml-2 rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-cream transition-colors hover:bg-brand-500"
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-cream/10 text-cream font-semibold"
                    : "text-cream-dim hover:bg-cream/5 hover:text-cream"
                )}
              >
                {item.label}
                {item.badge && (
                  <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-400">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-cream hover:bg-cream/10 sm:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="border-t border-cream-dim/10 bg-brand-950 p-4 sm:hidden">
          <Link
            href="/alerts"
            onClick={() => setMobileOpen(false)}
            className="mb-3 flex items-center justify-between rounded-xl border border-cream-dim/15 bg-cream/5 p-3 text-xs text-cream"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Mukuru Live Telemetry: 14.8 mm/h</span>
            </div>
            <span className="font-semibold text-brand-300">View Alerts →</span>
          </Link>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-cream/15 text-cream font-semibold"
                    : "text-cream-dim hover:bg-cream/5 hover:text-cream"
                )}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="mt-4 border-t border-cream-dim/10 pt-3 text-xs text-cream-dim flex items-center justify-between">
            <span>Kenya Red Cross Hotline:</span>
            <a href="tel:1199" className="font-bold text-cream flex items-center gap-1">
              <PhoneCall className="h-3 w-3 text-verified" /> 1199
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
