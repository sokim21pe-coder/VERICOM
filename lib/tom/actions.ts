"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ensureAppProfile } from "@/lib/auth/actions";
import { getCurrentContext } from "@/lib/auth/session";
import { authErrorMessage } from "@/lib/auth/errors";
import { recordAudit } from "@/lib/audit";
import { ErrorCode, PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";
import type { TomIntent } from "@/lib/tom/paths";
import type { TomConversation, TomMemoryItem, TomMessage } from "@/types/tom";
import { replyForIntent, routeIntent } from "@/lib/tom/intent-router";
import { intentFromMemories, upsertIntentMemory } from "@/lib/tom/memory";

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

function envConversationError(message: string) {
  return {
    ok: false,
    message,
    conversation: null as TomConversation | null,
    messages: [] as TomMessage[],
    memories: [] as TomMemoryItem[],
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
    .select("id, intent, company_id, deal_id, user_id")
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

  const extraMemory = await supabase
    .from("tom_memory_items")
    .select("memory_key, memory_value, information_state, source, confidence")
    .eq("conversation_id", conversation.id);
  const memoryRows =
    extraMemory.error
      ? (
          await supabase
            .from("tom_memory_items")
            .select("memory_key, memory_value, information_state")
            .eq("conversation_id", conversation.id)
        ).data
      : extraMemory.data;

  return {
    conversation: {
      id: conversation.id,
      intent: (conversation.intent as TomIntent) || intent,
      companyId: conversation.company_id,
      dealId: conversation.deal_id,
    },
    messages: (rows ?? []).map(mapMessage),
    memories: (memoryRows ?? []).map((row) => {
      const extra = row as {
        memory_key: string;
        memory_value: string | null;
        information_state: string;
        source?: string | null;
        confidence?: number | null;
      };
      return {
        key: extra.memory_key,
        value: extra.memory_value,
        informationState: extra.information_state,
        source: extra.source ?? null,
        confidence:
          typeof extra.confidence === "number" ? extra.confidence : null,
      };
    }),
  };
}

function requireSellerOrBuyerCompany(context: CurrentContext): string | null {
  const role = context.platformRole;
  const needsCompany =
    role === PlatformRole.SELLER_USER || role === PlatformRole.BUYER_USER;
  if (!context.companyMembership || !context.company) {
    return needsCompany
      ? "회사 연결이 필요합니다."
      : authErrorMessage[ErrorCode.PERMISSION_DENIED];
  }
  return null;
}

function conversationAllowed(
  conversation: TomConversation,
  context: CurrentContext,
): boolean {
  if (!context.company?.id) return false;
  if (conversation.companyId && conversation.companyId !== context.company.id) {
    return false;
  }
  return true;
}

function resolvedDealId(context: CurrentContext): string | null {
  return context.deal?.id ?? null;
}

async function bindConversationContext(
  supabase: SupabaseClient,
  conversationId: string,
  context: CurrentContext,
): Promise<void> {
  const bound = await supabase
    .from("tom_conversations")
    .update({
      company_id: context.company?.id ?? null,
      deal_id: context.deal?.id ?? null,
      platform_role: context.platformRole,
    })
    .eq("id", conversationId)
    .eq("user_id", context.user.id);
  if (bound.error) {
    await supabase
      .from("tom_conversations")
      .update({
        company_id: context.company?.id ?? null,
        deal_id: context.deal?.id ?? null,
      })
      .eq("id", conversationId)
      .eq("user_id", context.user.id);
  }
}

async function appendTomMessage(
  supabase: SupabaseClient,
  conversationId: string,
  body: string,
): Promise<void> {
  await supabase.from("tom_messages").insert({
    conversation_id: conversationId,
    author_role: "tom",
    body,
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
    return envConversationError(authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED]);
  }

  const ensured = await ensureAppProfile();
  if (!ensured.ok) {
    return envConversationError(ensured.message ?? authErrorMessage[ErrorCode.AUTH_REQUIRED]);
  }

  const context = await getCurrentContext();
  if (!context) {
    return envConversationError(authErrorMessage[ErrorCode.AUTH_REQUIRED]);
  }

  const membershipError = requireSellerOrBuyerCompany(context);
  if (membershipError) {
    return envConversationError(membershipError);
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return envConversationError(authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED]);
  }

  const { data: existing } = await supabase
    .from("tom_conversations")
    .select("id")
    .eq("user_id", context.user.id)
    .eq("intent", intent)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: conversationId, error } = await supabase.rpc(
    "get_or_create_tom_conversation",
    { p_intent: intent },
  );

  if (error || !conversationId) {
    return envConversationError("상담을 시작하지 못했습니다.");
  }

  await bindConversationContext(supabase, conversationId as string, context);

  if (!existing) {
    await recordAudit({
      action: "TOM_CONVERSATION_STARTED",
      entityType: "tom_conversation",
      entityId: conversationId as string,
    });
  }

  const loaded = await loadConversation(
    conversationId as string,
    context.user.id,
    intent,
  );
  if (!loaded.conversation || !conversationAllowed(loaded.conversation, context)) {
    return envConversationError("상담을 불러오지 못했습니다.");
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

  const membershipError = requireSellerOrBuyerCompany(context);
  if (membershipError) {
    return {
      ok: false,
      message: membershipError,
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

  const before = await loadConversation(conversationId, context.user.id, "sell");
  if (!before.conversation || !conversationAllowed(before.conversation, context)) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.PERMISSION_DENIED],
      messages: [],
      memories: [],
    };
  }

  const dealId = resolvedDealId(context);

  const { error } = await supabase.from("tom_messages").insert({
    conversation_id: conversationId,
    author_role: "user",
    body: text,
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

  await recordAudit({
    action: "TOM_MESSAGE_CREATED",
    entityType: "tom_message",
    entityId: conversationId,
  });

  const incoming = routeIntent(text);
  const previous = intentFromMemories(before.memories);
  const memoryResult = await upsertIntentMemory({
    supabase,
    conversationId,
    userId: context.user.id,
    companyId: context.company?.id ?? null,
    dealId,
    previous,
    incoming,
  });

  await recordAudit({
    action: "TOM_INTENT_EXTRACTED",
    entityType: "tom_memory_item",
    entityId: conversationId,
  });

  if (memoryResult.updated) {
    await recordAudit({
      action: "TOM_MEMORY_UPDATED",
      entityType: "tom_memory_item",
      entityId: conversationId,
    });
  }

  await appendTomMessage(
    supabase,
    conversationId,
    replyForIntent(memoryResult.stored.intent),
  );

  const refreshed = await loadConversation(
    conversationId,
    context.user.id,
    before.conversation.intent,
  );
  return {
    ok: true,
    message: null,
    messages: refreshed.messages,
    memories: refreshed.memories,
  };
}
