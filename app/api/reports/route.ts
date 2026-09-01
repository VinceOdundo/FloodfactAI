import { NextResponse, after } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { createReport } from "@/lib/data/reports";
import { runClassificationPipeline } from "@/lib/pipeline/classify";
import { checkRateLimit } from "@/lib/security/rate-limit";

const bodySchema = z.object({
  rawText: z.string().min(3).max(2000),
  claimedLocationText: z.string().max(200).optional(),
  phoneE164: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Use E.164 format, e.g. +254712345678")
    .optional(),
});

/** Public resident web-intake — the fallback channel alongside WhatsApp/SMS/ambassador. */
export async function POST(request: Request) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const { allowed, retryAfterMs } = checkRateLimit(`report:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many reports from this connection. Please wait a few minutes and try again." },
      { status: 429, headers: retryAfterMs ? { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) } : undefined }
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission", details: z.treeifyError(parsed.error) }, { status: 400 });
  }

  const reportId = await createReport({
    sourceChannel: "web",
    rawText: parsed.data.rawText,
    claimedLocationText: parsed.data.claimedLocationText ?? null,
    phoneE164: parsed.data.phoneE164 ?? null,
  });

  after(() => runClassificationPipeline(reportId).catch((err) => console.error(`Pipeline failed for ${reportId}:`, err)));

  return NextResponse.json({ id: reportId, status: "pending" }, { status: 202 });
}
