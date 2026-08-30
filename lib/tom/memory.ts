import type { SupabaseClient } from "@supabase/supabase-js";
import {
  INTENT_MEMORY_KEY,
  mergeRoutedIntent,
  parseRoutedIntent,
  type RoutedIntent,
} from "@/lib/tom/intent-router";
import type { TomMemoryItem } from "@/types/tom";

export function intentFromMemories(memories: TomMemoryItem[]): RoutedIntent | null {
  const row = memories.find((item) => item.key === INTENT_MEMORY_KEY);
  if (!row) return null;
  return parseRoutedIntent(row.value, row.informationState, row.confidence);
}

export async function upsertIntentMemory(input: {
  supabase: SupabaseClient;
  conversationId: string;
  userId: string;
  companyId: string | null;
  dealId: string | null;
  previous: RoutedIntent | null;
  incoming: RoutedIntent;
}): Promise<{ stored: RoutedIntent; updated: boolean }> {
  const { next, changed } = mergeRoutedIntent(input.previous, input.incoming);
  if (!changed && input.previous) {
    return { stored: input.previous, updated: false };
  }

  const { data: existing } = await input.supabase
    .from("tom_memory_items")
    .select("id")
    .eq("conversation_id", input.conversationId)
    .eq("memory_key", INTENT_MEMORY_KEY)
    .maybeSingle();

  const payload = {
    memory_key: INTENT_MEMORY_KEY,
    memory_value: next.value,
    information_state: next.informationState,
    user_id: input.userId,
    company_id: input.companyId,
    deal_id: input.dealId,
    source: next.source,
    confidence: next.confidence,
  };
  const legacyPayload = {
    memory_key: INTENT_MEMORY_KEY,
    memory_value: next.value,
    information_state: next.informationState,
  };

  if (existing?.id) {
    const updated = await input.supabase
      .from("tom_memory_items")
      .update(payload)
      .eq("id", existing.id);
    if (updated.error) {
      await input.supabase
        .from("tom_memory_items")
        .update(legacyPayload)
        .eq("id", existing.id);
    }
    return { stored: next, updated: true };
  }

  const inserted = await input.supabase.from("tom_memory_items").insert({
    conversation_id: input.conversationId,
    ...payload,
  });
  if (inserted.error) {
    await input.supabase.from("tom_memory_items").insert({
      conversation_id: input.conversationId,
      ...legacyPayload,
    });
  }
  return { stored: next, updated: true };
}
