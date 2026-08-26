"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ensureAppProfile } from "@/lib/auth/actions";
import { getCurrentContext } from "@/lib/auth/session";
import { authErrorMessage } from "@/lib/auth/errors";
import { ErrorCode, InformationState } from "@/types/enums";
import type { TomIntent } from "@/lib/tom/paths";
import type {
  TomConversation,
  TomIntentRouter,
  TomMemoryItem,
  TomMessage,
} from "@/types/tom";
import {
  extractIntentFromUtterance,
  mergeExtractedIntent,
  type ExtractedIntent,
} from "@/lib/tom/extract-intent";

const INTENT_MEMORY_KEY = "intent_router";

function mapMessage(row: {
  id: string;
  author_role: string;
  body: string;
  created_at: string;
}): TomMessage {
  return {
    id: row.id,
    authorRole: row.author_role as TomMessage["authorRole"],
    body: row.body,
    createdAt: row.created_at,
  };
}

async function loadConversation(
  conversationId: string,
  userId: string,
  intent: TomIntent,
): Promise<{
  conversation: TomConversation | null;
  messages: TomMessage[];
  memories: TomMemoryItem[];
}> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { conversation: null, messages: [], memories: [] };
  }

  const { data: conversation } = await supabase
    .from("tom_conversations")
    .select("id, intent, company_id, deal_id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!conversation) {
    return { conversation: null, messages: [], memories: [] };
  }

  const { data: rows } = await supabase
    .from("tom_messages")
    .select("id, author_role, body, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  const { data: memoryRows } = await supabase
    .from("tom_memory_items")
    .select("memory_key, memory_value, information_state")
    .eq("conversation_id", conversation.id);

  return {
    conversation: {
      id: conversation.id,
      intent: (conversation.intent as TomIntent) || intent,
      companyId: conversation.company_id,
      dealId: conversation.deal_id,
    },
    messages: (rows ?? []).map(mapMessage),
    memories: (memoryRows ?? []).map((row) => ({
      key: row.memory_key,
      value: row.memory_value,
      informationState: row.information_state,
    })),
  };
}

function previousIntentFromMemories(
  memories: TomMemoryItem[],
): ExtractedIntent | null {
  const row = memories.find((item) => item.key === INTENT_MEMORY_KEY);
  if (!row?.value) return null;
  const router = row.value as TomIntentRouter;
  if (
    router !== "SELL" &&
    router !== "BUY" &&
    router !== "FUNDRAISE" &&
    router !== "SUCCESSION" &&
    router !== "PARTNERSHIP" &&
    router !== "UNDECIDED"
  ) {
    return null;
  }
  const state =
    row.informationState === InformationState.CONFIRMED
      ? InformationState.CONFIRMED
      : row.informationState === InformationState.ESTIMATED
        ? InformationState.ESTIMATED
        : InformationState.UNKNOWN;
  return { router, state };
}

async function upsertIntentMemory(
  conversationId: string,
  extracted: ExtractedIntent,
): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return;

  const { data: existing } = await supabase
    .from("tom_memory_items")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("memory_key", INTENT_MEMORY_KEY)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("tom_memory_items")
      .update({
        memory_value: extracted.router,
        information_state: extracted.state,
      })
      .eq("id", existing.id);
    return;
  }

  await supabase.from("tom_memory_items").insert({
    conversation_id: conversationId,
    memory_key: INTENT_MEMORY_KEY,
    memory_value: extracted.router,
    information_state: extracted.state,
  });
}

export async function getOrCreateTomConversation(
  intent: TomIntent,
): Promise<{
  ok: boolean;
  message: string | null;
  conversation: TomConversation | null;
  messages: TomMessage[];
  memories: TomMemoryItem[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
      conversation: null,
      messages: [],
      memories: [],
    };
  }

  const ensured = await ensureAppProfile();
  if (!ensured.ok) {
    return {
      ok: false,
      message: ensured.message,
      conversation: null,
      messages: [],
      memories: [],
    };
  }

  const context = await getCurrentContext();
  if (!context) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.AUTH_REQUIRED],
      conversation: null,
      messages: [],
      memories: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
      conversation: null,
      messages: [],
      memories: [],
    };
  }

  const { data: conversationId, error } = await supabase.rpc(
    "get_or_create_tom_conversation",
    { p_intent: intent },
  );

  if (error || !conversationId) {
    return {
      ok: false,
      message: "상담을 시작하지 못했습니다.",
      conversation: null,
      messages: [],
      memories: [],
    };
  }

  const loaded = await loadConversation(
    conversationId as string,
    context.user.id,
    intent,
  );
  if (!loaded.conversation) {
    return {
      ok: false,
      message: "상담을 불러오지 못했습니다.",
      conversation: null,
      messages: [],
      memories: [],
    };
  }

  return {
    ok: true,
    message: null,
    conversation: loaded.conversation,
    messages: loaded.messages,
    memories: loaded.memories,
  };
}

export async function sendTomMessage(
  conversationId: string,
  body: string,
): Promise<{
  ok: boolean;
  message: string | null;
  messages: TomMessage[];
  memories: TomMemoryItem[];
}> {
  const text = body.trim();
  if (!text) {
    return {
      ok: false,
      message: "메시지를 입력해 주세요.",
      messages: [],
      memories: [],
    };
  }
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
      messages: [],
      memories: [],
    };
  }

  const context = await getCurrentContext();
  if (!context) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.AUTH_REQUIRED],
      messages: [],
      memories: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
      messages: [],
      memories: [],
    };
  }

  const { error } = await supabase.rpc("append_tom_user_message", {
    p_conversation_id: conversationId,
    p_body: text,
  });

  if (error) {
    if (error.message?.toLowerCase().includes("forbidden")) {
      return {
        ok: false,
        message: authErrorMessage[ErrorCode.PERMISSION_DENIED],
        messages: [],
        memories: [],
      };
    }
    return {
      ok: false,
      message: "메시지를 저장하지 못했습니다.",
      messages: [],
      memories: [],
    };
  }

  const loaded = await loadConversation(
    conversationId,
    context.user.id,
    "sell",
  );
  const merged = mergeExtractedIntent(
    previousIntentFromMemories(loaded.memories),
    extractIntentFromUtterance(text),
  );
  await upsertIntentMemory(conversationId, merged);
  const refreshed = await loadConversation(
    conversationId,
    context.user.id,
    "sell",
  );
  return {
    ok: true,
    message: null,
    messages: refreshed.messages,
    memories: refreshed.memories,
  };
}
