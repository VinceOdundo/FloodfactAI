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
    isActivePilot: false,
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
] as const;

export const FIXTURE_PUBLIC_ALERTS = [
  {
    id: "50000000-0000-0000-0000-000000000001",
    pilotAreaName: "Mukuru kwa Reuben",
    classification: "verified_warning" as const,
    messageEn:
      "VERIFIED FLOOD WARNING — Kanini Road railway crossing, Mukuru kwa Reuben. Water is rising rapidly along drainage culverts. Move to higher ground immediately and avoid the railway crossing. Verified by FloodFact AI.",
    messageSw:
      "ONYO LA MAFURIKO YALIYOTHIBITISHWA — Kivuko cha reli cha Kanini Road, Mukuru kwa Reuben. Maji yanapanda kwa kasi kando ya mifereji. Nenda maeneo ya juu mara moja na uepuke kivuko cha reli. Imethibitishwa na FloodFact AI.",
    landmark: "Kanini Road Railway Crossing",
    rainfallMmPerHour: 24.5,
    riverLevelStatus: "Ngong River +1.4m above baseline",
    ambassadorCount: 3,
    verificationSpeedSeconds: 84,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: "50000000-0000-0000-0000-000000000002",
    pilotAreaName: "Mukuru kwa Njenga",
    classification: "verified_warning" as const,
    messageEn:
      "VERIFIED FLOOD WARNING — Likoni Bridge & Ngong River Embankment, Mukuru kwa Njenga. River has breached channel banks. Residents in low-lying structures should evacuate to Kwa Njenga Primary School. Verified by FloodFact AI.",
    messageSw:
      "ONYO LA MAFURIKO YALIYOTHIBITISHWA — Daraja la Likoni na kingo za Mto Ngong, Mukuru kwa Njenga. Mto umefurika kingo zake. Wakazi wa nyumba za mabondeni wahamie Shule ya Msingi ya Kwa Njenga mara moja. Imethibitishwa na FloodFact AI.",
    landmark: "Likoni Bridge & Embankment",
    rainfallMmPerHour: 22.0,
    riverLevelStatus: "Ngong River +1.6m (High Hazard)",
    ambassadorCount: 4,
    verificationSpeedSeconds: 92,
    createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
  },
  {
    id: "50000000-0000-0000-0000-000000000003",
    pilotAreaName: "Mukuru kwa Njenga",
    classification: "elevated_risk" as const,
    messageEn:
      "ELEVATED FLOOD RISK — Mukuru kwa Njenga, near Simba Cool & Mombasa Road culvert. Heavy runoff accumulating with blocked roadside drainage. Keep children and valuables safe indoors. Verified by FloodFact AI.",
    messageSw:
      "HATARI YA MAFURIKO INAYOONGEZEKA — Mukuru kwa Njenga, karibu na Simba Cool na mfereji wa Mombasa Road. Maji mengi yanajikusanya kutokana na mifereji iliyoziba. Weka watoto na mali salama ndani. Imethibitishwa na FloodFact AI.",
    landmark: "Simba Cool / Mombasa Rd Culvert",
    rainfallMmPerHour: 14.8,
    riverLevelStatus: "Drainage runoff pooling",
    ambassadorCount: 2,
    verificationSpeedSeconds: 110,
    createdAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
  },
  {
    id: "50000000-0000-0000-0000-000000000004",
    pilotAreaName: "Mukuru kwa Reuben",
    classification: "elevated_risk" as const,
    messageEn:
      "ELEVATED FLOOD RISK — Gatwekera Footbridge path, Mukuru kwa Reuben. Steady rainfall reported with slow-moving water pooling along footpaths. Monitor conditions closely. Verified by FloodFact AI.",
    messageSw:
      "HATARI YA MAFURIKO INAYOONGEZEKA — Njia ya daraja la watembea kwa miguu la Gatwekera, Mukuru kwa Reuben. Mvua ya wastani inanyesha na maji yanatuama kwenye njia. Kuwa makini. Imethibitishwa na FloodFact AI.",
    landmark: "Gatwekera Footbridge Path",
    rainfallMmPerHour: 11.5,
    riverLevelStatus: "Normal channel flow (+0.4m)",
    ambassadorCount: 2,
    verificationSpeedSeconds: 104,
    createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
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
    rawText: "Heavy rain since morning, drainage along Mombasa road blocked, water entering some structures in kwa Njenga",
    pilotAreaId: "10000000-0000-0000-0000-000000000002",
    pilotAreaName: "Mukuru kwa Njenga",
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
  { id: "20000000-0000-0000-0000-000000000005", fullName: "Purity Nekesa", pilotAreaName: "Mukuru kwa Njenga", trainingStatus: "trained" as const, active: true },
  { id: "20000000-0000-0000-0000-000000000006", fullName: "Dennis Kiptoo", pilotAreaName: "Mukuru kwa Reuben", trainingStatus: "in_progress" as const, active: true },
] as const;
