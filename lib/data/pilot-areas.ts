import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { matchPilotAreaSlug } from "@/lib/core/geocode";
import type { GeoPoint } from "@/lib/providers/shared";

export interface PilotArea {
  id: string;
  slug: string;
  name: string;
  centroid: GeoPoint | null;
}

function parseCentroid(wkt: unknown): GeoPoint | null {
  // Supabase returns geography columns as GeoJSON when selected with the
  // `geojson` cast, or as WKB hex by default. We select via an RPC-free
  // approach: query centroid as text using PostGIS's ST_AsText through a
  // generated column would need a migration change, so instead we ask
  // PostgREST for the geography as GeoJSON directly (see select string).
  if (wkt && typeof wkt === "object" && "coordinates" in (wkt as Record<string, unknown>)) {
    const coords = (wkt as { coordinates: [number, number] }).coordinates;
    return { lon: coords[0], lat: coords[1] };
  }
  return null;
}

export async function getPilotAreaBySlug(slug: string): Promise<PilotArea | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("pilot_areas")
    .select("id, slug, name, centroid")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, slug: data.slug, name: data.name, centroid: parseCentroid(data.centroid) };
}

export async function getPilotAreaById(id: string): Promise<PilotArea | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("pilot_areas")
    .select("id, slug, name, centroid")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, slug: data.slug, name: data.name, centroid: parseCentroid(data.centroid) };
}

/**
 * Best-effort pilot-area resolution: gazetteer match on free text first
 * (works even with no coordinates — see lib/core/geocode.ts), falling back
 * to a real PostGIS containment check when a point is available.
 */
export async function resolvePilotArea(input: {
  freeText?: string | null;
  point?: GeoPoint | null;
}): Promise<PilotArea | null> {
  const slug = matchPilotAreaSlug(input.freeText);
  if (slug) {
    const area = await getPilotAreaBySlug(slug);
    if (area) return area;
  }

  if (input.point) {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("resolve_pilot_area", {
      p_point: `POINT(${input.point.lon} ${input.point.lat})`,
    });
    if (!error && data) {
      return getPilotAreaById(data as string);
    }
  }

  return null;
}
