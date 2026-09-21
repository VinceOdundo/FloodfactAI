import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { signOut } from "@/lib/actions/auth";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { Logomark } from "@/components/brand/logo";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login");
  }

  return (
    <div data-surface="ops" className="min-h-screen bg-background font-sans text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-surface/40 p-4 sm:block">
          <Link href="/admin" className="flex items-center gap-2.5 font-serif text-base font-semibold tracking-tight text-foreground hover:text-brand-600 transition-colors">
            <Logomark className="h-6 w-6 shrink-0" />
            <span>FloodFact <span className="text-brand-600 font-sans text-xs uppercase tracking-widest font-bold ml-0.5">Ops</span></span>
          </Link>
          <div className="mt-6">
            <SidebarNav />
          </div>
        </aside>
        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-xs">
            <div className="flex items-center gap-3">
              <AdminMobileNav />
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-safe animate-pulse" />
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground/70">
                  Mission Control <span className="text-foreground/40 font-normal">· Mukuru Sector</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-foreground/75 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                <span>{session.displayName}</span>
                <span className="rounded bg-brand-500/10 px-1.5 py-0.2 text-2xs font-semibold text-brand-700 uppercase">Admin</span>
              </div>
              <form action={signOut}>
                <button className="rounded-lg border border-border/80 px-2.5 py-1 text-xs font-medium text-foreground/60 transition-colors hover:bg-surface-muted hover:text-foreground">
                  Sign out
                </button>
              </form>
            </div>
          </header>
          <main className="p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
