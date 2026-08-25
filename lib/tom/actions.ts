"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { ensureAppProfile } from "@/lib/auth/actions";
import { getCurrentContext } from "@/lib/auth/session";
import { authErrorMessage } from "@/lib/auth/errors";
import { ErrorCode } from "@/types/enums";
import type { TomIntent } from "@/lib/tom/paths";
import type { TomConversation, TomMessage } from "@/types/tom";

const PLACEHOLDER_REPLY =
  "입력은 계정에 저장했습니다. TOM 모델 연결은 후속 단계입니다.";

function openingQuestion(intent: TomIntent): string {
  if (intent === "buy") return "어떤 회사를 찾고 계신가요?";
  return "회사와 관련해 요즘 가장 고민되는 것이 무엇인가요?";
}

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

export async function getOrCreateTomConversation(
  intent: TomIntent,
): Promise<{
  ok: boolean;
  message: string | null;
  conversation: TomConversation | null;
  messages: TomMessage[];
}> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
      conversation: null,
      messages: [],
    };
  }

  const ensured = await ensureAppProfile();
  if (!ensured.ok) {
    return {
      ok: false,
      message: ensured.message,
      conversation: null,
      messages: [],
    };
  }

  const context = await getCurrentContext();
  if (!context) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.AUTH_REQUIRED],
      conversation: null,
      messages: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
      conversation: null,
      messages: [],
    };
  }

  const { data: existing } = await supabase
    .from("tom_conversations")
    .select("id, intent, company_id, deal_id")
    .eq("user_id", context.user.id)
    .eq("intent", intent)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let conversation = existing;
  if (!conversation) {
    const { data: created, error } = await supabase
      .from("tom_conversations")
      .insert({
        user_id: context.user.id,
        company_id: context.company?.id ?? null,
        intent,
        status: "active",
      })
      .select("id, intent, company_id, deal_id")
      .single();
    if (error || !created) {
      return {
        ok: false,
        message: "상담을 시작하지 못했습니다.",
        conversation: null,
        messages: [],
      };
    }
    conversation = created;
    await supabase.from("tom_messages").insert({
      conversation_id: created.id,
      author_role: "tom",
      body: openingQuestion(intent),
    });
  }

  const { data: rows } = await supabase
    .from("tom_messages")
    .select("id, author_role, body, created_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  return {
    ok: true,
    message: null,
    conversation: {
      id: conversation.id,
      intent: conversation.intent as TomIntent,
      companyId: conversation.company_id,
      dealId: conversation.deal_id,
    },
    messages: (rows ?? []).map(mapMessage),
  };
}

export async function sendTomMessage(
  conversationId: string,
  body: string,
): Promise<{ ok: boolean; message: string | null; messages: TomMessage[] }> {
  const text = body.trim();
  if (!text) {
    return { ok: false, message: "메시지를 입력해 주세요.", messages: [] };
  }
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
      messages: [],
    };
  }

  const context = await getCurrentContext();
  if (!context) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.AUTH_REQUIRED],
      messages: [],
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
      messages: [],
    };
  }

  const { data: owned } = await supabase
    .from("tom_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (!owned) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.PERMISSION_DENIED],
      messages: [],
    };
  }

  const { error: userError } = await supabase.from("tom_messages").insert({
    conversation_id: conversationId,
    author_role: "user",
    body: text,
  });
  if (userError) {
    return { ok: false, message: "메시지를 저장하지 못했습니다.", messages: [] };
  }

  await supabase.from("tom_messages").insert({
    conversation_id: conversationId,
    author_role: "tom",
    body: PLACEHOLDER_REPLY,
  });

  const { data: rows } = await supabase
    .from("tom_messages")
    .select("id, author_role, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return { ok: true, message: null, messages: (rows ?? []).map(mapMessage) };
}
