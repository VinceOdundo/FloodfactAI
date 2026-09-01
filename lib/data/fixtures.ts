/**
 * Static fixture data for DEMO_MODE (no Supabase project configured) — the
 * same story as supabase/seed.sql, so a local preview and a real seeded
 * database look the same. Every query module in lib/data/queries checks
 * isDemoMode() and returns these instead of hitting Supabase. Never used
 * when a real project is configured.
 */

// Coordinates mirror supabase/seed.sql exactly (same ST_GeogFromText values)
// so DEMO_MODE tells the same geographic story as a seeded production DB.
export const FIXTURE_PILOT_AREAS = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    slug: "mukuru-kwa-reuben",
    name: "Mukuru kwa Reuben",
    isActivePilot: true,
    populationEstimate: 65000,
    centroid: [36.8676, -1.3086] as [number, number],
    boundary: [
      [36.8636, -1.3056], [36.8716, -1.3056], [36.8716, -1.3116], [36.8636, -1.3116], [36.8636, -1.3056],
    ] as [number, number][],
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    slug: "mukuru-kwa-njenga",
    name: "Mukuru kwa Njenga",
    isActivePilot: true,
    populationEstimate: 90000,
    centroid: [36.879, -1.3139] as [number, number],
    boundary: [
      [36.875, -1.3109], [36.883, -1.3109], [36.883, -1.3169], [36.875, -1.3169], [36.875, -1.3109],
    ] as [number, number][],
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    slug: "viwandani",
    name: "Viwandani",
    isActivePilot: true,
    populationEstimate: 40000,
    centroid: [36.858, -1.302] as [number, number],
    boundary: [
      [36.854, -1.299], [36.862, -1.299], [36.862, -1.305], [36.854, -1.305], [36.854, -1.299],
    ] as [number, number][],
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    slug: "kibera",
    name: "Kibera",
    isActivePilot: false,
    populationEstimate: 185000,
    centroid: [36.782, -1.3133] as [number, number],
    boundary: [
      [36.778, -1.3103], [36.786, -1.3103], [36.786, -1.3163], [36.778, -1.3163], [36.778, -1.3103],
    ] as [number, number][],
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    slug: "mathare",
    name: "Mathare",
    isActivePilot: false,
    populationEstimate: 87000,
    centroid: [36.857, -1.2586] as [number, number],
    boundary: [
      [36.853, -1.2556], [36.861, -1.2556], [36.861, -1.2616], [36.853, -1.2616], [36.853, -1.2556],
    ] as [number, number][],
  },
] as const;

// Mirrors supabase/seed.sql's historical_flood_events exactly — including
// the honest "ILLUSTRATIVE EXAMPLE" caveat on the one entry that isn't an
// independently sourced incident.
export const FIXTURE_HISTORICAL_EVENTS = [
  {
    id: "70000000-0000-0000-0000-000000000001",
    pilotAreaId: "10000000-0000-0000-0000-000000000005",
    locationName: "Mathare",
    eventDate: "2024-04-15",
    description:
      "Flash flood struck Mathare at approximately 2 AM with no official alert issued; residents woke to waist-high water. A viral WhatsApp voice note falsely claiming a nearby dam had burst caused families to flee into unaffected, more dangerous streets; two people were injured in the panic.",
    source: "Kenya Red Cross field report, Apr 2024",
    severity: "severe" as const,
    deaths: 0,
    householdsAffected: null,
  },
  {
    id: "70000000-0000-0000-0000-000000000002",
    pilotAreaId: "10000000-0000-0000-0000-000000000004",
    locationName: "Kibera",
    eventDate: "2023-05-01",
    description:
      "Long rains caused severe flooding across Kibera. KMD had issued a regional advisory but it never reached households; the average delay before any alert reached residents was 72 hours. So many false WhatsApp warnings had circulated earlier that many residents dismissed the eventual official SMS alerts as rumours, and thousands delayed evacuation.",
    source: "Kenya Red Cross 2023; iHub Kenya Research",
    severity: "severe" as const,
    deaths: null,
    householdsAffected: null,
  },
  {
    id: "70000000-0000-0000-0000-000000000003",
    pilotAreaId: "10000000-0000-0000-0000-000000000001",
    locationName: "Mukuru kwa Reuben",
    eventDate: "2022-11-20",
    description:
      "ILLUSTRATIVE EXAMPLE (not independently sourced): moderate flooding along the Ngong River affecting low-lying structures. Included to demonstrate the historical-base-rate evidence source until real Mukuru-specific incident records are collected during the Phase-1 pilot.",
    source: "Illustrative — replace with verified pilot-collected records",
    severity: "moderate" as const,
    deaths: 0,
    householdsAffected: 40,
  },
] as const;

export const FIXTURE_PILOT_METRICS = [
  {
    pilotAreaId: "10000000-0000-0000-0000-000000000001",
    pilotAreaSlug: "mukuru-kwa-reuben",
    pilotAreaName: "Mukuru kwa Reuben",
    reportsTotal: 1,
    falseInformationRatePct: 0,
    avgVerificationSeconds: 120,
    alertsTotal: 1,
    alertsWithin30MinPct: 100,
    ambassadorsActive: 2,
    ambassadorsTrainedPct: 100,
    householdsReachedTotal: 34,
  },
  {
    pilotAreaId: "10000000-0000-0000-0000-000000000002",
    pilotAreaSlug: "mukuru-kwa-njenga",
    pilotAreaName: "Mukuru kwa Njenga",
    reportsTotal: 1,
    falseInformationRatePct: 100,
    avgVerificationSeconds: 120,
    alertsTotal: 1,
    alertsWithin30MinPct: 100,
    ambassadorsActive: 2,
    ambassadorsTrainedPct: 50,
    householdsReachedTotal: 51,
  },
  {
    pilotAreaId: "10000000-0000-0000-0000-000000000003",
    pilotAreaSlug: "viwandani",
    pilotAreaName: "Viwandani",
    reportsTotal: 1,
    falseInformationRatePct: 0,
    avgVerificationSeconds: 120,
    alertsTotal: 1,
    alertsWithin30MinPct: 100,
    ambassadorsActive: 2,
    ambassadorsTrainedPct: 50,
    householdsReachedTotal: 22,
  },
] as const;

export const FIXTURE_PUBLIC_ALERTS = [
  {
    id: "50000000-0000-0000-0000-000000000001",
    pilotAreaName: "Mukuru kwa Reuben",
    classification: "verified_warning" as const,
    messageEn:
      "VERIFIED FLOOD WARNING — Kanini Road area, Mukuru kwa Reuben. Water is rising. Move to higher ground now and avoid the railway crossing. Verified by FloodFact AI.",
    createdAt: new Date(Date.now() - 1000 * 60 * 175).toISOString(),
  },
  {
    id: "50000000-0000-0000-0000-000000000003",
    pilotAreaName: "Viwandani",
    classification: "elevated_risk" as const,
    messageEn:
      "ELEVATED FLOOD RISK — Viwandani, near Likoni Road. Moderate rainfall and drainage blockage reported. Monitor conditions and keep valuables off the floor. Verified by FloodFact AI.",
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
] as const;

export const FIXTURE_REPORTS = [
  {
    id: "30000000-0000-0000-0000-000000000001",
    sourceChannel: "whatsapp",
    rawText: "Water is rising fast near the railway crossing in kwa Reuben, already at knee height on Kanini Road",
    pilotAreaId: "10000000-0000-0000-0000-000000000001",
    pilotAreaName: "Mukuru kwa Reuben",
    hazardType: "flood",
    status: "classified",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    classification: {
      classification: "verified_warning" as const,
      confidence: 0.88,
      insufficientEvidence: false,
      rationaleEn:
        "Heavy rainfall in the last 3 hours, the location sits inside a mapped high flood-risk zone, similar events have happened here before, and 2 other nearby reports corroborate rising water.",
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000002",
    sourceChannel: "whatsapp",
    rawText: "Nimesikia wanasema dam imepasuka karibu na Njenga, watu wanakimbia!",
    pilotAreaId: "10000000-0000-0000-0000-000000000002",
    pilotAreaName: "Mukuru kwa Njenga",
    hazardType: "rumor",
    status: "classified",
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    classification: {
      classification: "false_information" as const,
      confidence: 0.82,
      insufficientEvidence: false,
      rationaleEn:
        "This message closely matches a previously confirmed false 'dam has burst' rumour pattern, current rainfall at the claimed location is minimal, and the point is outside any mapped flood-risk zone.",
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000003",
    sourceChannel: "sms",
    rawText: "Heavy rain since morning, drainage along Mombasa road blocked, water entering some structures in Viwandani",
    pilotAreaId: "10000000-0000-0000-0000-000000000003",
    pilotAreaName: "Viwandani",
    hazardType: "flood",
    status: "classified",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    classification: {
      classification: "elevated_risk" as const,
      confidence: 0.61,
      insufficientEvidence: false,
      rationaleEn:
        "Moderate rainfall and a degraded (not fully confirmed) flood-risk reading for this point put this in the elevated-risk band; monitor and prepare, evacuation is not yet clearly warranted.",
    },
  },
  {
    id: "30000000-0000-0000-0000-000000000004",
    sourceChannel: "ambassador",
    rawText: "Resident reports drizzle only, no flooding observed, but worried about forwarded voice note",
    pilotAreaId: "10000000-0000-0000-0000-000000000001",
    pilotAreaName: "Mukuru kwa Reuben",
    hazardType: "rumor",
    status: "escalated",
    createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    classification: null,
  },
] as const;

export const FIXTURE_ESCALATIONS = [
  {
    id: "80000000-0000-0000-0000-000000000001",
    reportId: "30000000-0000-0000-0000-000000000004",
    pilotAreaName: "Mukuru kwa Reuben",
    reason:
      "Insufficient evidence: no rainfall/river/ambassador ground-truth available for this point yet, and the report itself is ambiguous. Routed to a human rather than guessed.",
    status: "open" as const,
    createdAt: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
  },
] as const;

export const FIXTURE_DATA_SOURCE_HEALTH = [
  { source: "open_meteo", mode: "sandbox" as const, status: "ok" as const, lastSuccessAt: new Date().toISOString() },
  { source: "arcgis_flood_risk", mode: "sandbox" as const, status: "ok" as const, lastSuccessAt: new Date().toISOString() },
  { source: "river_level", mode: "sandbox" as const, status: "down" as const, lastSuccessAt: null },
  { source: "llm_anthropic", mode: "sandbox" as const, status: "ok" as const, lastSuccessAt: new Date().toISOString() },
  { source: "embeddings_voyage", mode: "sandbox" as const, status: "ok" as const, lastSuccessAt: new Date().toISOString() },
  { source: "whatsapp", mode: "sandbox" as const, status: "ok" as const, lastSuccessAt: new Date().toISOString() },
  { source: "sms_africastalking", mode: "sandbox" as const, status: "ok" as const, lastSuccessAt: new Date().toISOString() },
] as const;

export const FIXTURE_AMBASSADORS = [
  { id: "20000000-0000-0000-0000-000000000001", fullName: "Faith Wanjiru", pilotAreaName: "Mukuru kwa Reuben", trainingStatus: "trained" as const, active: true },
  { id: "20000000-0000-0000-0000-000000000002", fullName: "Brian Otieno", pilotAreaName: "Mukuru kwa Reuben", trainingStatus: "trained" as const, active: true },
  { id: "20000000-0000-0000-0000-000000000003", fullName: "Grace Achieng", pilotAreaName: "Mukuru kwa Njenga", trainingStatus: "trained" as const, active: true },
  { id: "20000000-0000-0000-0000-000000000004", fullName: "Kevin Mwangi", pilotAreaName: "Mukuru kwa Njenga", trainingStatus: "in_progress" as const, active: true },
  { id: "20000000-0000-0000-0000-000000000005", fullName: "Purity Nekesa", pilotAreaName: "Viwandani", trainingStatus: "trained" as const, active: true },
  { id: "20000000-0000-0000-0000-000000000006", fullName: "Dennis Kiptoo", pilotAreaName: "Viwandani", trainingStatus: "not_started" as const, active: true },
] as const;
