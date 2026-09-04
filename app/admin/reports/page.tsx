import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ClassificationBadge } from "@/components/classification-badge";
import {
  searchReports,
  listActivePilotAreasForSelect,
  type ClassificationLabel,
} from "@/lib/data/queries/admin";

const STATUSES = ["pending", "processing", "classified", "escalated", "resolved", "failed"] as const;
const CLASSIFICATIONS: ClassificationLabel[] = ["verified_warning", "elevated_risk", "false_information"];
const PAGE_SIZE = 20;

function buildQuery(params: Record<string, string | undefined>, overrides: Record<string, string | number>) {
  const merged = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...overrides })) {
    if (value !== undefined && value !== "") merged.set(key, String(value));
  }
  return `/admin/reports?${merged.toString()}`;
}

export default async function AdminReportsPage(props: PageProps<"/admin/reports">) {
  const sp = await props.searchParams;
  const get = (key: string) => (typeof sp[key] === "string" ? (sp[key] as string) : undefined);

  const filters = {
    status: get("status"),
    classification: get("classification") as ClassificationLabel | undefined,
    pilotAreaId: get("pilotAreaId"),
    from: get("from"),
    to: get("to"),
    q: get("q"),
  };
  const page = Math.max(1, Number(get("page") ?? "1") || 1);

  const [result, pilotAreas] = await Promise.all([
    searchReports({ ...filters, page, pageSize: PAGE_SIZE }),
    listActivePilotAreasForSelect(),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const rawFilters = { status: filters.status, classification: filters.classification, pilotAreaId: filters.pilotAreaId, from: filters.from, to: filters.to, q: filters.q };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">All reports</h1>
        <p className="mt-1 text-sm text-foreground/60">
          {result.total} report{result.total === 1 ? "" : "s"} — search and filter beyond the dashboard&apos;s recent feed.
        </p>
      </div>

      <form method="get" className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3 lg:grid-cols-6">
        <input
          type="search"
          name="q"
          aria-label="Search report text"
          defaultValue={filters.q ?? ""}
          placeholder="Search text…"
          className="col-span-2 rounded-lg border border-border bg-background p-2 text-sm focus:border-brand-500 focus:outline-none sm:col-span-3 lg:col-span-2"
        />
        <select
          name="status"
          aria-label="Filter by status"
          defaultValue={filters.status ?? ""}
          className="rounded-lg border border-border bg-background p-2 text-sm"
        >
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="classification"
          aria-label="Filter by classification"
          defaultValue={filters.classification ?? ""}
          className="rounded-lg border border-border bg-background p-2 text-sm"
        >
          <option value="">Any classification</option>
          {CLASSIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          name="pilotAreaId"
          aria-label="Filter by pilot area"
          defaultValue={filters.pilotAreaId ?? ""}
          className="rounded-lg border border-border bg-background p-2 text-sm"
        >
          <option value="">Any pilot area</option>
          {pilotAreas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          aria-label="From date"
          defaultValue={filters.from ?? ""}
          className="rounded-lg border border-border bg-background p-2 text-sm"
        />
        <input
          type="date"
          name="to"
          aria-label="To date"
          defaultValue={filters.to ?? ""}
          className="rounded-lg border border-border bg-background p-2 text-sm"
        />
        <button
          type="submit"
          className="col-span-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 sm:col-span-1"
        >
          Filter
        </button>
        {Object.values(rawFilters).some(Boolean) && (
          <Link
            href="/admin/reports"
            className="col-span-2 flex items-center justify-center rounded-lg border border-border px-3 py-2 text-sm text-foreground/60 hover:bg-surface-muted sm:col-span-1"
          >
            Clear
          </Link>
        )}
      </form>

      <div className="space-y-2">
        {result.items.map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between gap-2">
              {r.classification ? (
                <ClassificationBadge classification={r.classification.classification} />
              ) : (
                <span className="text-xs font-medium uppercase text-foreground/50">{r.status}</span>
              )}
              <span className="text-xs text-foreground/40">
                {r.sourceChannel} · {new Date(r.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-1.5 line-clamp-2 text-sm text-foreground/80">{r.rawText}</p>
            <p className="mt-1 text-xs text-foreground/40">{r.pilotAreaName ?? "unresolved location"}</p>
            <Link href={`/admin/reports/${r.id}`} className="mt-1 inline-block text-xs text-brand-500 hover:underline">
              View details →
            </Link>
          </Card>
        ))}
        {result.items.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-foreground/50">
            No reports match these filters.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Link
            href={buildQuery(rawFilters, { page: Math.max(1, page - 1) })}
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none text-foreground/30" : "text-brand-500 hover:underline"}
          >
            ← Previous
          </Link>
          <span className="text-foreground/50">
            Page {page} of {totalPages}
          </span>
          <Link
            href={buildQuery(rawFilters, { page: Math.min(totalPages, page + 1) })}
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? "pointer-events-none text-foreground/30" : "text-brand-500 hover:underline"}
          >
            Next →
          </Link>
        </div>
      )}
    </div>
  );
}
