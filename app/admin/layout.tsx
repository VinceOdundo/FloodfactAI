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
    <div data-surface="ops" className="min-h-screen bg-background font-mono text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r border-border p-4 sm:block">
          <Link href="/admin" className="flex items-center gap-2 font-serif text-sm font-semibold tracking-wide text-sage">
            <Logomark className="h-5 w-5 shrink-0" />
            FloodFact · Ops
          </Link>
          <div className="mt-8">
            <SidebarNav />
          </div>
        </aside>
        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-3">
              <AdminMobileNav />
              <p className="text-xs uppercase tracking-widest text-foreground/50">Mission Control</p>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="hidden text-foreground/70 sm:inline">{session.displayName}</span>
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
