import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentContext } from "@/lib/auth/session";

/** 서버 Action에서만 호출. 실패해도 본 작업은 막지 않는다. */
export async function recordAudit(input: {
  action: string;
  entityType?: string;
  entityId?: string;
}): Promise<void> {
  try {
    const context = await getCurrentContext();
    const supabase = await createSupabaseServerClient();
    if (!supabase || !context) return;
    await supabase.from("audit_logs").insert({
      actor_user_id: context.user.id,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    });
    await supabase.from("activities").insert({
      actor_user_id: context.user.id,
      activity_type: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
    });
  } catch {
    return;
  }
}
