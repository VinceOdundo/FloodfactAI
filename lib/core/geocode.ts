/**
 * Hyperlocal gazetteer for Nairobi's informal settlements.
 *
 * Commercial geocoders (Google, Mapbox, even most OSM-based ones) have poor
 * coverage of Mukuru's internal streets and landmark names — this is a
 * known, well-documented gap for informal settlements generally, not a
 * shortcut. A small hand-built alias list of the names residents actually
 * use is the standard, defensible approach here. It gets a report to the
 * right pilot area's evidence lookup even before/without a resolved
 * lat/lon; a resolved point additionally goes through the real PostGIS
 * ST_Contains check in app.resolve_pilot_area (supabase/migrations).
 */
export interface GazetteerEntry {
  pilotAreaSlug: string;
  /** Lowercase landmark, street, or sub-village names, longest/most specific first is not required — matching prefers the longest alias hit. */
  aliases: string[];
}

export const GAZETTEER: GazetteerEntry[] = [
  {
    pilotAreaSlug: "mukuru-kwa-reuben",
    aliases: ["kwa reuben", "mukuru kwa reuben", "reuben", "kanini road", "kanini", "enterprise road", "lunga lunga"],
  },
  {
    pilotAreaSlug: "mukuru-kwa-njenga",
    aliases: ["kwa njenga", "mukuru kwa njenga", "njenga", "imara daima", "sinai", "donholm"],
  },
  {
    pilotAreaSlug: "viwandani",
    aliases: ["viwandani", "likoni road", "industrial area"],
  },
  {
    pilotAreaSlug: "kibera",
    aliases: ["kibera", "kianda", "soweto east", "soweto west", "makina", "laini saba", "gatwekera"],
  },
  {
    pilotAreaSlug: "mathare",
    aliases: ["mathare", "mathare north", "mabatini", "kosovo", "huruma"],
  },
];

/** Best-effort match of free text (a raw message or a claimed-location string) to a pilot area slug. */
export function matchPilotAreaSlug(freeText: string | null | undefined): string | null {
  if (!freeText) return null;
  const normalized = freeText.toLowerCase();

  let best: { slug: string; aliasLength: number } | null = null;
  for (const entry of GAZETTEER) {
    for (const alias of entry.aliases) {
      if (normalized.includes(alias) && (!best || alias.length > best.aliasLength)) {
        best = { slug: entry.pilotAreaSlug, aliasLength: alias.length };
      }
    }
  }
  return best?.slug ?? null;
}
