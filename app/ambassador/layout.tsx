import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { signOut } from "@/lib/actions/auth";
import { RegisterServiceWorker } from "@/components/ambassador/register-service-worker";
import { Logomark } from "@/components/brand/logo";

export default async function AmbassadorLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "ambassador") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <RegisterServiceWorker />
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <div>
          <Link href="/ambassador" className="flex items-center gap-2 font-serif text-base font-semibold text-brand-700">
            <Logomark className="h-7 w-7 shrink-0" />
            FloodFact AI
          </Link>
          <p className="text-xs text-foreground/50">{session.pilotAreaName}</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-foreground/50">Sign out</button>
        </form>
      </header>
      <main className="mx-auto max-w-md px-4 py-4 pb-24">{children}</main>
    </div>
  );
}
