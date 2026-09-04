import Link from "next/link";
import type { ReactNode } from "react";
import { Code2 } from "lucide-react";
import { MobileNav } from "@/components/ui/mobile-nav";
import { Logomark } from "@/components/brand/logo";

const NAV_ITEMS = [
  { href: "/blog", label: "Blog" },
  { href: "/alerts", label: "Verified Alerts" },
  { href: "/report", label: "Report a Flood" },
  { href: "/login", label: "Staff Login" },
];

const FOOTER_LINKS = {
  Product: [
    { href: "/report", label: "Report a flood or rumour" },
    { href: "/alerts", label: "Verified alerts feed" },
    { href: "/login", label: "Staff login" },
  ],
  Resources: [
    { href: "/blog", label: "Blog" },
    { href: "/blog/how-classification-works", label: "How classification works" },
    { href: "/blog/flood-safety-basics", label: "Flood safety basics" },
  ],
  Project: [
    { href: "https://github.com/VinceOdundo/FloodfactAI", label: "Source code" },
    { href: "https://github.com/VinceOdundo/FloodfactAI/blob/main/docs/ARCHITECTURE.md", label: "Architecture" },
    { href: "https://github.com/VinceOdundo/FloodfactAI/blob/main/docs/SETUP.md", label: "Setup guide" },
  ],
};

// Not typed with the generated LayoutProps<Path> helper: this layout is
// shared across several sibling routes ('/', '/report', '/alerts', '/blog')
// via a route group, not tied to one specific path, and takes no params.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-brand-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-serif text-lg font-semibold tracking-tight text-cream">
            <Logomark className="h-7 w-7 shrink-0" />
            FloodFact <span className="text-sage">AI</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-cream-dim sm:flex">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="whitespace-nowrap transition-colors hover:text-cream">
                {item.label}
              </Link>
            ))}
          </nav>
          <MobileNav items={NAV_ITEMS} />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-brand-950">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-4 sm:px-6">
          <div className="sm:col-span-1">
            <p className="flex items-center gap-2 font-serif text-lg font-semibold text-cream">
              <Logomark className="h-7 w-7 shrink-0" />
              FloodFact <span className="text-sage">AI</span>
            </p>
            <p className="mt-3 text-sm text-cream-dim">
              Phase 1 pilot: Mukuru, Nairobi. Built for the AI x City Climate Action Hackathon 2026.
            </p>
            <a
              href="https://github.com/VinceOdundo/FloodfactAI"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-cream-dim transition-colors hover:text-cream"
            >
              <Code2 className="h-4 w-4" />
              Source on GitHub
            </a>
          </div>
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-xs font-semibold uppercase tracking-widest text-cream-dim/70">{heading}</p>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-cream-dim transition-colors hover:text-cream">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-cream-dim/10 px-4 py-5 text-center text-xs tracking-wide text-cream-dim/60 sm:px-6">
          SDG 11 · SDG 13 · SDG 17
        </div>
      </footer>
    </div>
  );
}
