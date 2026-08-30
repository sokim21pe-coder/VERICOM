import type { SupabaseClient } from "@supabase/supabase-js";
import { InformationState } from "@/types/enums";
import {
  DISCOVERY_LAST_QUESTION_KEY,
  encodeMemorySource,
  isMultiValueField,
  type DiscoveryFieldId,
  type MemoryCharacter,
} from "@/lib/tom/discovery-fields";
import type { DiscoveryCapture } from "@/lib/tom/extract-discovery";
import type { TomMemoryItem } from "@/types/tom";
import { mergeStoredMultiValue } from "@/lib/tom/criteria-value";

export async function upsertTomMemoryRow(input: {
  supabase: SupabaseClient;
  conversationId: string;
  userId: string;
  companyId: string | null;
  dealId: string | null;
  key: string;
  value: string | null;
  informationState: InformationState;
  origin: string;
  character: MemoryCharacter;
  confidence: number;
}): Promise<boolean> {
  const { data: existing } = await input.supabase
    .from("tom_memory_items")
    .select("id, information_state")
    .eq("conversation_id", input.conversationId)
    .eq("memory_key", input.key)
    .maybeSingle();

  if (
    existing &&
    existing.information_state === InformationState.CONFIRMED &&
    input.informationState === InformationState.UNKNOWN
  ) {
    return false;
  }

  const payload = {
    memory_key: input.key,
    memory_value: input.value,
    information_state: input.informationState,
    user_id: input.userId,
    company_id: input.companyId,
    deal_id: input.dealId,
    source: encodeMemorySource(input.origin, input.character),
    confidence: input.confidence,
  };
  const legacy = {
    memory_key: input.key,
    memory_value: input.value,
    information_state: input.informationState,
  };

  if (existing?.id) {
    const updated = await input.supabase
      .from("tom_memory_items")
      .update(payload)
      .eq("id", existing.id);
    if (updated.error) {
      await input.supabase.from("tom_memory_items").update(legacy).eq("id", existing.id);
    }
    return true;
  }

  const inserted = await input.supabase.from("tom_memory_items").insert({
    conversation_id: input.conversationId,
    ...payload,
  });
  if (inserted.error) {
    await input.supabase.from("tom_memory_items").insert({
      conversation_id: input.conversationId,
      ...legacy,
    });
  }
  return true;
}

export async function persistDiscoveryCaptures(input: {
  supabase: SupabaseClient;
  conversationId: string;
  userId: string;
  companyId: string | null;
  dealId: string | null;
  captures: DiscoveryCapture[];
  existingMemories?: TomMemoryItem[];
}): Promise<number> {
  let written = 0;
  for (const item of input.captures) {
    let value = item.value;
    if (!item.skipped && isMultiValueField(item.field)) {
      const previous = input.existingMemories?.find((row) => row.key === item.field);
      if (previous?.value) {
        value = mergeStoredMultiValue(previous.value, item.value);
      }
    }
    const ok = await upsertTomMemoryRow({
      ...input,
      key: item.field,
      value,
      informationState: item.informationState,
      origin: "user_message",
      character: "USER_CLAIM",
      confidence: item.skipped ? 0 : 1,
    });
    if (ok) written += 1;
  }
  return written;
}

export async function persistLastQuestion(input: {
  supabase: SupabaseClient;
  conversationId: string;
  userId: string;
  companyId: string | null;
  dealId: string | null;
  field: DiscoveryFieldId | null;
}): Promise<void> {
  await upsertTomMemoryRow({
    ...input,
    key: DISCOVERY_LAST_QUESTION_KEY,
    value: input.field,
    informationState: input.field
      ? InformationState.CONFIRMED
      : InformationState.UNKNOWN,
    origin: "question_engine",
    character: "USER_CLAIM",
    confidence: 1,
  });
}

export async function seedContextMemories(input: {
  supabase: SupabaseClient;
  conversationId: string;
  userId: string;
  companyId: string | null;
  dealId: string | null;
  companyName: string | null;
  industry: string | null;
}): Promise<void> {
  if (input.companyName?.trim()) {
    await upsertTomMemoryRow({
      ...input,
      key: "company_name",
      value: input.companyName.trim(),
      informationState: InformationState.CONFIRMED,
      origin: "company_db",
      character: "FACT",
      confidence: 1,
    });
  }
  if (input.industry?.trim()) {
    await upsertTomMemoryRow({
      ...input,
      key: "industry",
      value: input.industry.trim(),
      informationState: InformationState.CONFIRMED,
      origin: "company_db",
      character: "FACT",
      confidence: 1,
    });
  }
}
