import "server-only";
import { z } from "zod";

/**
 * Every provider auto-detects live vs. sandbox by whether its required env
 * vars are present — there is no manual mode toggle to forget. See
 * docs/ARCHITECTURE.md "Mode switch" and docs/SETUP.md for what to add to
 * go live.
 */
const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("FloodFact AI"),

  // Supabase — required in production; absent means DEMO_MODE fixtures power the UI.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v === "true" || v === "1"),

  // Security — required in production, defaulted only so `next build`/tests
  // don't need real secrets in this sandbox.
  CRON_SECRET: z.string().min(16).default("local-dev-cron-secret-not-for-prod"),
  REPORT_HMAC_SECRET: z.string().min(16).default("local-dev-report-hmac-not-for-prod"),
  ADMIN_REVEAL_AUDIT_SALT: z.string().min(16).default("local-dev-reveal-salt-not-for-prod"),
  AT_INBOUND_SECRET: z.string().min(16).default("local-dev-at-inbound-secret-not-for-prod"),

  // WhatsApp Cloud API (Meta) — optional, sandbox mode if absent.
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
  // Meta deprecates Graph API versions on a schedule — check
  // developers.facebook.com for the current one rather than trusting any
  // hardcoded default to stay valid indefinitely.
  WHATSAPP_API_VERSION: z.string().default("v21.0"),

  // SMS (Africa's Talking) — optional, sandbox mode if absent.
  AT_USERNAME: z.string().default("sandbox"),
  AT_API_KEY: z.string().optional(),
  AT_SHORTCODE: z.string().optional(),

  // LLM (Anthropic) — optional, sandbox mode if absent.
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5"),

  // Embeddings (Voyage AI) — optional, sandbox mode if absent.
  VOYAGE_API_KEY: z.string().optional(),
  VOYAGE_MODEL: z.string().default("voyage-3.5"),

  // Weather — free & keyless, always attempted live.
  OPEN_METEO_BASE_URL: z.string().url().default("https://api.open-meteo.com"),

  // Flood-risk geography (Esri ArcGIS) — optional key for enhanced layers;
  // many Living Atlas layers are queryable anonymously without one.
  ARCGIS_API_KEY: z.string().optional(),
  ARCGIS_FLOOD_LAYER_URL: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof schema>;

function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment configuration:", z.treeifyError(parsed.error));
    throw new Error("Invalid environment configuration — see logged errors above.");
  }
  const env = parsed.data;

  if (env.NODE_ENV === "production" && !env.DEMO_MODE) {
    const missing = [
      !env.NEXT_PUBLIC_SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
      !env.NEXT_PUBLIC_SUPABASE_ANON_KEY && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      !env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean);
    if (missing.length > 0) {
      throw new Error(
        `Missing required production env vars: ${missing.join(", ")}. ` +
          `Set DEMO_MODE=true only for a non-production preview without a database.`
      );
    }
  }

  return env;
}

export const env = loadEnv();

/** True when there is no real Supabase project configured, or DEMO_MODE is forced on. */
export const isDemoMode = () => env.DEMO_MODE === true || !env.NEXT_PUBLIC_SUPABASE_URL;

export type ProviderMode = "live" | "sandbox";

export const providerMode = {
  whatsapp: (): ProviderMode =>
    env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID ? "live" : "sandbox",
  sms: (): ProviderMode => (env.AT_API_KEY ? "live" : "sandbox"),
  llm: (): ProviderMode => (env.ANTHROPIC_API_KEY ? "live" : "sandbox"),
  embeddings: (): ProviderMode => (env.VOYAGE_API_KEY ? "live" : "sandbox"),
  // A specific hosted layer URL is what makes a query possible; the API key
  // is only needed for secured layers and is appended as a token when set.
  floodRisk: (): ProviderMode => (env.ARCGIS_FLOOD_LAYER_URL ? "live" : "sandbox"),
};
