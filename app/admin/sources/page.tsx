import { getDataSourceHealth } from "@/lib/data/queries/admin";
import { DataSourcesView } from "@/components/admin/data-sources-view";

export default async function DataSourcesPage() {
  const sources = await getDataSourceHealth();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Data source health</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Every evidence provider, live or sandbox. A source reads &ldquo;sandbox&rdquo; until its real credentials are
          added — see docs/SETUP.md — never presented as live data in the meantime.
        </p>
      </div>

      <DataSourcesView initialSources={sources} />
    </div>
  );
}
