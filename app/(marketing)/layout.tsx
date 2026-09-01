import Link from "next/link";
import type { ReactNode } from "react";

// Not typed with the generated LayoutProps<Path> helper: this layout is
// shared across several sibling routes ('/', '/report', '/alerts') via a
// route group, not tied to one specific path, and takes no params.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-brand-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="whitespace-nowrap font-serif text-lg font-semibold tracking-tight text-cream">
            FloodFact <span className="text-sage">AI</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-cream-dim sm:gap-6">
            <Link href="/alerts" className="hidden transition-colors hover:text-cream sm:inline">
              Verified Alerts
            </Link>
            <Link href="/report" className="hidden transition-colors hover:text-cream sm:inline">
              Report a Flood
            </Link>
            <Link
              href="/login"
              className="whitespace-nowrap rounded-full border border-cream-dim/30 px-3.5 py-1.5 text-cream transition-colors hover:border-cream-dim/60 hover:bg-cream/10 sm:px-4"
            >
              Staff Login
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-brand-950 py-10 text-center text-sm text-cream-dim">
        <p>FloodFact AI — Phase 1 pilot: Mukuru, Nairobi. Built for the AI x City Climate Action Hackathon 2026.</p>
        <p className="mt-1.5 tracking-wide text-cream-dim/70">SDG 11 · SDG 13 · SDG 17</p>
      </footer>
    </div>
  );
}
