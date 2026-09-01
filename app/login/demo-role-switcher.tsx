import { Button } from "@/components/ui/button";
import { setDemoRole } from "@/lib/actions/auth";

/** DEMO_MODE only: no real Supabase project is configured, so there's nothing to authenticate against — pick a role to preview instead. */
export function DemoRoleSwitcher() {
  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-elevated-bg px-3 py-2 text-xs font-medium text-elevated">
        Sandbox demo — no real login configured. Pick a role to preview.
      </p>
      <form action={setDemoRole.bind(null, "admin")}>
        <Button type="submit" className="w-full" size="lg">
          View as Admin (mission control)
        </Button>
      </form>
      <form action={setDemoRole.bind(null, "ambassador")}>
        <Button type="submit" className="w-full" size="lg" variant="outline">
          View as Youth Ambassador
        </Button>
      </form>
    </div>
  );
}
