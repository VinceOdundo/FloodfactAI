/**
 * Blog content, stored as structured data rather than markdown/MDX — no new
 * parsing dependency, and the block shape below is all these posts need.
 * Every post here is either an explanation of the real, shipped system or
 * general public flood-safety guidance. Nothing claims pilot results: the
 * Mukuru pilot is Phase 1, just starting (see docs/submission's Pilot Plan)
 * — there are no results to report yet, and this content doesn't pretend
 * otherwise.
 */

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO
  readMinutes: number;
  body: Block[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "how-classification-works",
    title: "How FloodFact AI classifies a report in under two minutes",
    excerpt:
      "A walk through the real six-stage pipeline — from a WhatsApp message to a verdict with evidence attached.",
    category: "Product",
    date: "2026-08-18",
    readMinutes: 6,
    body: [
      {
        type: "p",
        text: "Every report FloodFact AI receives — a WhatsApp message, an SMS, a web form submission, or a youth ambassador's field note — runs through the same six-stage pipeline before anyone sees a verdict. None of it is hidden: the code is lib/pipeline/classify.ts calling lib/core/risk-engine.ts, and every stage writes an audit record.",
      },
      { type: "h2", text: "1. Understand" },
      {
        type: "p",
        text: "Claude reads the raw message and extracts what's actually stated: hazard type, claimed location, urgency, language. It is instructed to extract only what's present, never to infer facts that aren't there. The extraction is logged verbatim to nlu_extractions before anything else happens.",
      },
      { type: "h2", text: "2. Geocode" },
      {
        type: "p",
        text: "The claimed location text is matched against a hand-built gazetteer of Mukuru landmarks and sub-areas, then resolved to a pilot area polygon via PostGIS. \"Near the railway crossing on Kanini Road\" becomes a point inside Mukuru kwa Reuben's boundary, not a guess.",
      },
      { type: "h2", text: "3. Gather evidence" },
      {
        type: "p",
        text: "In parallel: rainfall intensity for that point, whether it sits inside a mapped flood-risk zone, the historical base rate of flooding for that sub-area, any other recent reports nearby, ambassador ground-truth if one has been logged, and how closely the message matches known rumour patterns. Every fetch — success, failure, or sandbox — becomes a row in evidence_items. A failed fetch is recorded as unavailable; it is never silently dropped or treated as a negative signal.",
      },
      { type: "h2", text: "4. Decide" },
      {
        type: "p",
        text: "This is the one step with no LLM call. scoreReport() in lib/core/risk-engine.ts is a pure, deterministic function — the same evidence always produces the same verdict. It's covered by 23 unit tests, each one a safety rule: missing or conflicting evidence routes to escalation, never to \"False Information\"; a message is never pushed toward false purely because it repeats something already said elsewhere.",
      },
      { type: "h2", text: "5. Explain" },
      {
        type: "p",
        text: "Only after the verdict is decided does Claude get involved again — to write the plain-language, bilingual rationale a resident actually reads. It explains a decision it did not make.",
      },
      { type: "h2", text: "6. Alert" },
      {
        type: "p",
        text: "A classification-specific message goes out over whichever channels are configured — WhatsApp, SMS, the public alerts feed, and the ambassador queue — and every delivery attempt is recorded per channel.",
      },
      {
        type: "p",
        text: "Total elapsed time in the sandbox demo: about two minutes end to end, most of it evidence-fetch latency rather than anything that needs speeding up before a real pilot.",
      },
    ],
  },
  {
    slug: "why-not-let-the-llm-decide",
    title: "Why we kept the AI out of the safety decision",
    excerpt:
      "Language models are excellent at reading a message. They are the wrong tool for deciding whether 500 households should trust a warning.",
    category: "Engineering",
    date: "2026-08-11",
    readMinutes: 5,
    body: [
      {
        type: "p",
        text: "It would have been faster to build FloodFact AI as a single prompt: hand an LLM the message and some context, ask it to classify. We didn't, and the reason is specific, not philosophical.",
      },
      {
        type: "p",
        text: "A classifier that can hallucinate is fine for a lot of products. It is not fine for a system that tells people whether to evacuate. An LLM can be confidently wrong, can be swayed by phrasing rather than evidence, and — critically — cannot be exhaustively tested the way a deterministic function can. You cannot write a unit test that proves a language model will never claim certainty it doesn't have.",
      },
      {
        type: "p",
        text: "So the verdict — Verified Warning, Elevated Risk, or False Information — comes from lib/core/risk-engine.ts: a small, pure, fully deterministic scoring function with 23 test cases, each one encoding a specific safety rule. Given the same evidence, it always returns the same answer. That's a property you can verify once and trust forever, which is not something you can say about a model call.",
      },
      { type: "h2", text: "So what is the LLM actually for?" },
      {
        type: "ul",
        items: [
          "Structured extraction — pulling hazard type, location, and urgency out of a messy WhatsApp message, constrained to only what's stated.",
          "Rationale generation — turning the engine's already-decided evidence list into a plain-language, bilingual explanation a resident can act on.",
          "Nothing else. Every LLM call and its raw output is logged for audit — it's a participant in the pipeline, not a gatekeeper of it.",
        ],
      },
      {
        type: "p",
        text: "The one state this design exists to protect is insufficient_evidence — tracked as its own boolean, distinct from the three public classifications, and unable to silently collapse into \"False Information\" no matter how the engine's other rules fire. When the evidence genuinely isn't there, the system says so and routes to a human, rather than guessing with confidence it hasn't earned.",
      },
    ],
  },
  {
    slug: "flood-safety-basics",
    title: "Flood safety basics for Nairobi's rainy season",
    excerpt: "A short, practical list — the same guidance every resident should know before the long rains, not specific to any app.",
    category: "Community",
    date: "2026-08-04",
    readMinutes: 4,
    body: [
      {
        type: "p",
        text: "None of this is FloodFact-specific. It's standard flood-safety guidance worth repeating every rainy season, especially in low-lying areas near rivers and drainage channels.",
      },
      { type: "h2", text: "Before the rains" },
      {
        type: "ul",
        items: [
          "Know your nearest higher ground and at least two routes to reach it that don't cross a river, culvert, or low bridge.",
          "Agree on a family meeting point in case phones lose signal or power.",
          "Keep a small bag ready with a torch, any essential medication, and copies of important documents.",
        ],
      },
      { type: "h2", text: "When water starts rising" },
      {
        type: "ul",
        items: [
          "Move to higher ground immediately — don't wait to see how high it gets.",
          "Never walk or drive through moving floodwater. 15 centimetres of fast-moving water can knock an adult off their feet.",
          "Avoid railway crossings and low bridges during heavy rain — they flood first and are hard to see underwater.",
          "Keep valuables and anything electrical off the floor if you can't leave immediately.",
        ],
      },
      { type: "h2", text: "About rumours" },
      {
        type: "p",
        text: "During past flood events in Nairobi, false warnings — a dam supposedly bursting, a river supposedly breaching upstream — have spread faster than official alerts and caused people to flee into more dangerous streets than the ones they left. If a message can't be verified against an official source, treat it with caution and, where possible, check it against another source before acting or forwarding it.",
      },
    ],
  },
  {
    slug: "understanding-the-three-labels",
    title: "Verified Warning, Elevated Risk, False Information: what the three labels mean",
    excerpt: "Every classification is one of exactly three things — and what each one should mean for what you do next.",
    category: "Product",
    date: "2026-07-28",
    readMinutes: 3,
    body: [
      {
        type: "p",
        text: "FloodFact AI never returns a bare \"true\" or \"false.\" Every report that clears classification lands in one of three states, each with a distinct meaning and a distinct recommended action.",
      },
      { type: "h2", text: "Verified Warning" },
      {
        type: "p",
        text: "Multiple independent signals agree: rainfall, flood-risk zone membership, historical pattern, and/or corroborating reports point the same way. This is the highest-confidence state and the one that should change what you do right now — move to higher ground, avoid the affected route.",
      },
      { type: "h2", text: "Elevated Risk" },
      {
        type: "p",
        text: "Some signals point toward risk, but not enough to reach the confidence bar for a full warning — moderate rainfall without corroboration, for instance, or a degraded (not fully confirmed) reading from one source. The right response is to monitor conditions and prepare, not to assume the worst or dismiss it.",
      },
      { type: "h2", text: "False Information" },
      {
        type: "p",
        text: "The claim doesn't hold up against real evidence — often because it matches a previously confirmed rumour pattern, or because current conditions at the claimed location contradict it. A correction is sent directly to whoever reported it; debunked rumours aren't given a second life by being republished, even as \"debunked.\"",
      },
      {
        type: "p",
        text: "There's a fourth, internal-only state worth knowing about: insufficient_evidence. It is never shown to the public as a classification — it routes the case to a human operator instead of forcing a guess. See our post on why the AI doesn't make the safety call for the reasoning behind that design.",
      },
    ],
  },
  {
    slug: "why-youth-ambassadors",
    title: "The youth ambassador model: why the human layer matters",
    excerpt: "Software can cross-check evidence in seconds. It can't build the years of local trust that make a warning worth acting on.",
    category: "Community",
    date: "2026-07-21",
    readMinutes: 4,
    body: [
      {
        type: "p",
        text: "The Phase 1 pilot plan calls for 10 trained youth ambassadors in each of Mukuru's three wards — kwa Reuben, kwa Njenga, and Viwandani. They are not a customer-support layer bolted onto the software; they are load-bearing.",
      },
      { type: "h2", text: "What they actually do" },
      {
        type: "ul",
        items: [
          "Ground-truth: confirming or correcting an uncertain report in person, feeding a real observation back into the evidence store for the next nearby case.",
          "Escalation review: the human decision-maker whenever the risk engine reports insufficient_evidence rather than guessing.",
          "Distribution: carrying verified alerts to households without reliable WhatsApp or SMS access, and updating the physical community notice boards.",
          "Trust: explaining a verdict in the local language, from someone the household already knows, not a notification from an app they've never heard of.",
        ],
      },
      { type: "h2", text: "Built into the system, not bolted on" },
      {
        type: "p",
        text: "Each ambassador's account is scoped to their own ward at the database level — row-level security, not an if-statement in the UI — so an ambassador's session literally cannot query another ward's reports. Their observations (a water-level reading, a households-reached count, a simple yes/no visual confirmation) are stored as first-class evidence, with the same audit trail as every other signal the risk engine considers.",
      },
      {
        type: "p",
        text: "The pitch for this system was never \"replace the community with AI.\" It's the other way around: let the software do the two-minute evidence check so the humans who are already trusted can spend their time on the part only they can do.",
      },
    ],
  },
  {
    slug: "sandbox-mode-and-what-a-partnership-unlocks",
    title: "What's real today, and what a partnership could unlock",
    excerpt: "Every screen you can see right now runs on real code and an honest sandbox. Here's exactly what changes with real accounts.",
    category: "Partnerships",
    date: "2026-07-14",
    readMinutes: 4,
    body: [
      {
        type: "p",
        text: "We built FloodFact AI to be fully demonstrable without a single paid account, and to say so plainly everywhere it matters. Every screen — the public site, the admin console, the ambassador app — runs today from a DEMO_MODE fixture set with the same story a seeded production database would tell.",
      },
      {
        type: "p",
        text: "Independently of that, every external integration — WhatsApp, SMS, the LLM, embeddings, flood-risk geography — self-selects live or sandbox based on whether its own credential is present, and a sandbox response is always stamped quality: \"degraded,\" never presented as live data. The admin Data Sources panel shows exactly which mode each one is in, at all times.",
      },
      { type: "h2", text: "What a real deployment adds" },
      {
        type: "ul",
        items: [
          "Supabase project — the fixtures become live Postgres rows behind the same row-level security policies.",
          "Meta WhatsApp Cloud API — a free test number covers pilot-scale volume before production verification.",
          "Africa's Talking — Kenya's standard SMS gateway, for the fallback channel and for residents without WhatsApp.",
          "Anthropic and Voyage AI keys — the structured extraction, rationale generation, and rumour-pattern matching steps go live; the risk engine's decision logic doesn't change at all, because it was never touched by any of these keys to begin with.",
          "Esri ArcGIS Living Atlas / KMD access — replacing the seeded PostGIS fallback with the specific flood-risk layers and rainfall advisories named in the pilot scope.",
        ],
      },
      {
        type: "p",
        text: "None of this is a rewrite. It's docs/SETUP.md, followed once. That's a deliberate architectural choice, not a coincidence — a system worth trusting with a flood warning should be just as legible when it's running for real as when it's being evaluated.",
      },
    ],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getSortedBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));
}
