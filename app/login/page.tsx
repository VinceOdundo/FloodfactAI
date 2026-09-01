import type { Metadata } from "next";
import { isDemoMode } from "@/lib/config/env";
import { DemoRoleSwitcher } from "./demo-role-switcher";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Staff Login" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-xl font-bold">FloodFact AI staff login</h1>
        <p className="mt-1 text-sm text-foreground/60">For admins and youth ambassadors only.</p>
        <div className="mt-6">{isDemoMode() ? <DemoRoleSwitcher /> : <LoginForm />}</div>
      </div>
    </div>
  );
}
