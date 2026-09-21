import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Smartphone,
  Globe,
  Users,
  MapPin,
  Clock,
  Filter,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ClassificationBadge } from "@/components/classification-badge";
import { WhatsAppLogo } from "@/components/brand/whatsapp-logo";
import {
  searchReports,
  listActivePilotAreasForSelect,
  type ClassificationLabel,
} from "@/lib/data/queries/admin";

const STATUSES = ["pending", "processing", "classified", "escalated", "resolved", "failed"] as const;
const CLASSIFICATIONS: ClassificationLabel[] = ["verified_warning", "elevated_risk", "false_information"];
const PAGE_SIZE = 20;

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  whatsapp: { label: "WhatsApp", icon: WhatsAppLogo, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  sms: { label: "SMS", icon: Smartphone, color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
  web: { label: "Web Portal", icon: Globe, color: "text-sky-700", bg: "bg-sky-50 border-sky-200" },
  ambassador: { label: "Ambassador", icon: Users, color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

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
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">All Citizen Reports</h1>
          <p className="mt-1 text-sm text-foreground/60">
            {result.total} report{result.total === 1 ? "" : "s"}: search, filter, and inspect verified evidence across all channels.
          </p>
        </div>
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

      <div className="space-y-3">
        {result.items.map((r) => {
          const channel = CHANNEL_CONFIG[r.sourceChannel] ?? CHANNEL_CONFIG.web;
          const ChannelIcon = channel.icon;
          return (
            <Card key={r.id} className="p-4 transition-all hover:border-brand-500/40 hover:shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-semibold ${channel.bg} ${channel.color}`}>
                    <ChannelIcon className="h-3 w-3 shrink-0" />
                    <span>{channel.label}</span>
                  </span>
                  {r.classification ? (
                    <ClassificationBadge classification={r.classification.classification} />
                  ) : (
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-2xs font-semibold uppercase text-foreground/50">
                      {r.status}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-2xs text-foreground/50">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                </span>
              </div>

              <p className="mt-2.5 text-sm font-medium leading-relaxed text-foreground">
                &ldquo;{r.rawText}&rdquo;
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-2xs">
                <span className="flex items-center gap-1.5 text-foreground/60 font-medium">
                  <MapPin className="h-3 w-3 text-brand-600 shrink-0" />
                  <span>{r.pilotAreaName ?? "Location not resolved"}</span>
                </span>
                <Link
                  href={`/admin/reports/${r.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  <span>Inspect evidence</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          );
        })}
        {result.items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-foreground/50">
            No citizen reports match these filters.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
        <Link
          href={buildQuery(rawFilters, { page: Math.max(1, page - 1) })}
          aria-disabled={page <= 1}
          className={`inline-flex items-center gap-1 ${page <= 1 ? "pointer-events-none text-foreground/30" : "text-brand-500 hover:underline"}`}
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </Link>
        <span className="text-foreground/50">
          Page {page} of {totalPages}
        </span>
        <Link
          href={buildQuery(rawFilters, { page: Math.min(totalPages, page + 1) })}
          aria-disabled={page >= totalPages}
          className={`inline-flex items-center gap-1 ${page >= totalPages ? "pointer-events-none text-foreground/30" : "text-brand-500 hover:underline"}`}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Link>
        </div>
      )}
    </div>
  );
}
