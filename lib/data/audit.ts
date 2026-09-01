import "server-only";
import { isDemoMode } from "@/lib/config/env";
import { createServiceClient } from "@/lib/supabase/service";

export interface AuditEventInput {
  actorType: "system" | "user";
  actorId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Record<string, unknown>;
}

export async function writeAuditEvent(input: AuditEventInput): Promise<void> {
  if (isDemoMode()) return;
  const supabase = createServiceClient();
  const { error } = await supabase.from("audit_events").insert({
    actor_type: input.actorType,
    actor_id: input.actorId,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    payload: input.payload ?? null,
  });
  if (error) {
    console.error(`Failed to write audit event (${input.action}):`, error.message);
  }
}
