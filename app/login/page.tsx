import type { Metadata } from "next";
import Link from "next/link";
import { isDemoMode } from "@/lib/config/env";
import { RippleMotif } from "@/components/brand/ripple-motif";
import { DemoRoleSwitcher } from "./demo-role-switcher";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Staff Login" };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero-gradient px-4">
      <RippleMotif className="pointer-events-none absolute -bottom-24 -left-24 h-[420px] w-[420px] opacity-70" />
      <div className="relative w-full max-w-sm rounded-2xl border border-cream-dim/15 bg-surface p-8 shadow-[0_24px_60px_-20px_rgba(8,29,26,0.5)]">
        <Link href="/" className="font-serif text-base font-semibold text-brand-700">
          FloodFact <span className="text-brand-500">AI</span>
        </Link>
        <h1 className="mt-4 font-serif text-xl font-semibold text-foreground">Staff login</h1>
        <p className="mt-1 text-sm text-foreground/60">For admins and youth ambassadors only.</p>
        <div className="mt-6">{isDemoMode() ? <DemoRoleSwitcher /> : <LoginForm />}</div>
      </div>
    </div>
  );
}
