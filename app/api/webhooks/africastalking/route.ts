import { NextResponse, after } from "next/server";
import type { NextRequest } from "next/server";
import { env } from "@/lib/config/env";
import { constantTimeEqual } from "@/lib/security/hmac";
import { createReport } from "@/lib/data/reports";
import { runClassificationPipeline } from "@/lib/pipeline/classify";

/**
 * Africa's Talking has no request-signing mechanism, so the callback URL
 * configured in the AT dashboard carries a shared secret:
 * https://yourapp.com/api/webhooks/africastalking?token=AT_INBOUND_SECRET
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!constantTimeEqual(token, env.AT_INBOUND_SECRET)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const form = await request.formData();
  const from = form.get("from")?.toString();
  const text = form.get("text")?.toString();

  if (from && text) {
    after(async () => {
      try {
        const reportId = await createReport({
          sourceChannel: "sms",
          rawText: text,
          phoneE164: from.startsWith("+") ? from : `+${from}`,
        });
        await runClassificationPipeline(reportId);
      } catch (err) {
        console.error("Failed to process inbound SMS:", err);
      }
    });
  }

  return NextResponse.json({ ok: true });
}
