import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { signOut } from "@/lib/actions/auth";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/escalations", label: "Escalations" },
  { href: "/admin/metrics", label: "Pilot Metrics" },
  { href: "/admin/sources", label: "Data Sources" },
  { href: "/admin/ambassadors", label: "Ambassadors" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div data-surface="ops" className="min-h-screen bg-background font-mono text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r border-border p-4 sm:block">
          <Link href="/admin" className="block font-serif text-sm font-semibold tracking-wide text-sage">
            FloodFact · Ops
          </Link>
          <nav className="mt-8 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-foreground/70 transition-colors hover:bg-surface-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-xs uppercase tracking-widest text-foreground/50">Mission Control</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-foreground/70">{session.displayName}</span>
              <form action={signOut}>
                <button className="text-foreground/50 hover:text-foreground">Sign out</button>
              </form>
            </div>
          </header>
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
