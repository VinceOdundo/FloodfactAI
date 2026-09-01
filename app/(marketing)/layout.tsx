import Link from "next/link";
import type { ReactNode } from "react";

// Not typed with the generated LayoutProps<Path> helper: this layout is
// shared across several sibling routes ('/', '/report', '/alerts') via a
// route group, not tied to one specific path, and takes no params.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            FloodFact <span className="text-brand-600">AI</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium">
            <Link href="/alerts" className="hover:text-brand-600">
              Verified Alerts
            </Link>
            <Link href="/report" className="hover:text-brand-600">
              Report a Flood
            </Link>
            <Link href="/login" className="hover:text-brand-600">
              Staff Login
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8 text-center text-sm text-foreground/60">
        <p>FloodFact AI — Phase 1 pilot: Mukuru, Nairobi. Built for the AI x City Climate Action Hackathon 2026.</p>
        <p className="mt-1">SDG 11 · SDG 13 · SDG 17</p>
      </footer>
    </div>
  );
}
