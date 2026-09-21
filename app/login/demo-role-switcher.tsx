import { Shield, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setDemoRole } from "@/lib/actions/auth";

/**
 * DEMO_MODE role switcher with rich context for evaluator convenience.
 */
export function DemoRoleSwitcher() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-500/30 bg-amber-50/70 p-3 text-xs text-amber-900">
        <p className="font-semibold">Sandbox Evaluation Mode</p>
        <p className="mt-0.5 text-amber-800/80">
          Pick a role to preview the live experience. No credentials needed.
        </p>
      </div>

      {/* Admin Role Card */}
      <div className="rounded-xl border border-border bg-surface-muted/50 p-4 transition-colors hover:border-brand-500/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800 text-cream">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <p className="font-serif text-sm font-semibold text-foreground">Mission Control</p>
              <p className="text-xs text-foreground/50">Admin &amp; Response Coordinator</p>
            </div>
          </div>
          <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
            Full Access
          </span>
        </div>

        <ul className="mt-3 space-y-1 text-xs text-foreground/70">
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-safe shrink-0" />
            <span>Real-time GIS flood hazard map</span>
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-safe shrink-0" />
            <span>Escalation triage &amp; evidence audit</span>
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-safe shrink-0" />
            <span>Data source health &amp; SLA metrics</span>
          </li>
        </ul>

        <form action={setDemoRole.bind(null, "admin")} className="mt-3.5">
          <Button type="submit" className="w-full justify-between" size="sm">
            <span>View as Admin (mission control)</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>

      {/* Youth Ambassador Role Card */}
      <div className="rounded-xl border border-border bg-surface-muted/50 p-4 transition-colors hover:border-brand-500/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-cream">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="font-serif text-sm font-semibold text-foreground">Youth Ambassador PWA</p>
              <p className="text-xs text-foreground/50">Mukuru Field Observers</p>
            </div>
          </div>
          <span className="rounded-md bg-surface px-2 py-0.5 text-[11px] font-semibold text-foreground/60 border border-border">
            Field PWA
          </span>
        </div>

        <ul className="mt-3 space-y-1 text-xs text-foreground/70">
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-safe shrink-0" />
            <span>Offline-capable case review queue</span>
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-safe shrink-0" />
            <span>Ground-truth water depth logging</span>
          </li>
          <li className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-safe shrink-0" />
            <span>Scoped to Mukuru kwa Reuben &amp; Njenga</span>
          </li>
        </ul>

        <form action={setDemoRole.bind(null, "ambassador")} className="mt-3.5">
          <Button type="submit" className="w-full justify-between" size="sm" variant="outline">
            <span>View as Youth Ambassador</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
