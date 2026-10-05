"use server";

import { revalidatePath } from "next/cache";
import { recordAudit } from "@/lib/audit";
import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  canApproveTeaser,
  canCreateTeaser,
  canEditTeaser,
} from "@/lib/teaser/access";
import { loadSellerTeaserView } from "@/lib/teaser/data";
import type { TeaserContent, TeaserSectionContent } from "@/lib/teaser/types";

// Teaser 서버 액션. 모든 쓰기는 security-definer RPC를 통해서만 수행한다.
// 승인은 approve_teaser RPC 호출(IN_REVIEW → APPROVED)로만 일어난다. 저장=승인 아님.
// 저장소(0020) 미적용이면 사용자에게 안내만 하고 실패로 반환한다.

export type TeaserActionState = {
  ok: boolean;
  message: string | null;
};

const STORAGE_NOT_READY =
  "티저 저장소가 아직 준비되지 않았습니다. 마이그레이션(0020) 적용 후 이용할 수 있습니다.";
const AUTH_REQUIRED = "로그인이 필요합니다.";
const PERMISSION_DENIED = "권한이 없습니다. 본인 회사의 Seller만 가능합니다.";
const ENV_NOT_READY = "Supabase 연결 정보가 없어 처리할 수 없습니다.";

function fail(message: string): TeaserActionState {
  return { ok: false, message };
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

/** 폼 입력(섹션 본문/헤드라인)으로 기존 content를 갱신한다. dataPoints/missing은 보존. */
function contentFromForm(base: TeaserContent, formData: FormData): TeaserContent {
  const headline = formString(formData, "headline").trim();
  const sections: TeaserSectionContent[] = base.sections.map((section) => {
    const edited = formData.get(`section_${section.id}`);
    if (typeof edited !== "string") return section;
    return { ...section, body: edited.trim() };
  });
  return {
    ...base,
    headline: headline || base.headline,
    sections,
  };
}

export async function createTeaserDraftAction(): Promise<TeaserActionState> {
  if (!isSupabaseConfigured()) return fail(ENV_NOT_READY);

  const context = await getCurrentContext();
  if (!context) return fail(AUTH_REQUIRED);
  if (!canCreateTeaser(context)) return fail(PERMISSION_DENIED);

  const view = await loadSellerTeaserView(context);
  if (!view.companyId) return fail(PERMISSION_DENIED);
  if (!view.storageReady) return fail(STORAGE_NOT_READY);

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail(ENV_NOT_READY);

  const { data, error } = await supabase.rpc("create_teaser_draft", {
    p_company_id: view.companyId,
    p_content: view.record?.content ?? view.preview,
    p_headline: (view.record?.content ?? view.preview).headline,
    p_masked_descriptor: (view.record?.content ?? view.preview).maskedDescriptor,
    p_identity_masked: true,
    p_deal_id: view.dealId,
    p_conversation_id: view.conversationId,
  });

  if (error) return fail("티저 초안을 만들지 못했습니다.");

  await recordAudit({
    action: "TEASER_DRAFT_CREATED",
    entityType: "teasers",
    entityId: data ? String(data) : undefined,
  });
  revalidatePath("/seller/teaser");
  return { ok: true, message: "티저 초안을 만들었습니다." };
}

export async function saveTeaserAction(
  _prev: TeaserActionState,
  formData: FormData,
): Promise<TeaserActionState> {
  if (!isSupabaseConfigured()) return fail(ENV_NOT_READY);

  const context = await getCurrentContext();
  if (!context) return fail(AUTH_REQUIRED);

  const view = await loadSellerTeaserView(context);
  if (!view.companyId || !canEditTeaser(context, view.companyId)) {
    return fail(PERMISSION_DENIED);
  }
  if (!view.storageReady) return fail(STORAGE_NOT_READY);
  if (!view.record) return fail("저장할 티저가 없습니다. 먼저 초안을 만들어 주세요.");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail(ENV_NOT_READY);

  const nextContent = contentFromForm(view.record.content, formData);

  const { error } = await supabase.rpc("save_teaser_version", {
    p_teaser_id: view.record.id,
    p_content: nextContent,
    p_headline: nextContent.headline,
    p_masked_descriptor: nextContent.maskedDescriptor,
    p_identity_masked: nextContent.identityMasked,
  });

  if (error) return fail("티저를 저장하지 못했습니다.");

  await recordAudit({
    action: "TEASER_UPDATED",
    entityType: "teasers",
    entityId: view.record.id,
  });
  revalidatePath("/seller/teaser");
  // 편집은 승인을 무효화하고 DRAFT로 되돌린다(명세: 승인 내용 수정 시 재검토).
  const wasApproved = view.record.status === "APPROVED";
  return {
    ok: true,
    message: wasApproved
      ? "변경을 저장했습니다. 승인이 해제되어 다시 검토가 필요합니다."
      : "변경을 저장했습니다.",
  };
}

export async function submitTeaserForReviewAction(): Promise<TeaserActionState> {
  if (!isSupabaseConfigured()) return fail(ENV_NOT_READY);

  const context = await getCurrentContext();
  if (!context) return fail(AUTH_REQUIRED);

  const view = await loadSellerTeaserView(context);
  if (!view.companyId || !canEditTeaser(context, view.companyId)) {
    return fail(PERMISSION_DENIED);
  }
  if (!view.storageReady) return fail(STORAGE_NOT_READY);
  if (!view.record) return fail("검토할 티저가 없습니다.");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail(ENV_NOT_READY);

  const { error } = await supabase.rpc("submit_teaser_for_review", {
    p_teaser_id: view.record.id,
  });
  if (error) return fail("검토 요청을 처리하지 못했습니다.");

  await recordAudit({
    action: "TEASER_REVIEWED",
    entityType: "teasers",
    entityId: view.record.id,
  });
  revalidatePath("/seller/teaser");
  return { ok: true, message: "검토 단계로 보냈습니다. 내용을 확인한 뒤 승인하세요." };
}

export async function approveTeaserAction(): Promise<TeaserActionState> {
  if (!isSupabaseConfigured()) return fail(ENV_NOT_READY);

  const context = await getCurrentContext();
  if (!context) return fail(AUTH_REQUIRED);

  const view = await loadSellerTeaserView(context);
  if (!view.companyId || !canApproveTeaser(context, view.companyId)) {
    return fail(PERMISSION_DENIED);
  }
  if (!view.storageReady) return fail(STORAGE_NOT_READY);
  if (!view.record) return fail("승인할 티저가 없습니다.");

  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail(ENV_NOT_READY);

  const { error } = await supabase.rpc("approve_teaser", {
    p_teaser_id: view.record.id,
  });
  if (error) return fail("승인하지 못했습니다. 검토 단계인지 확인해 주세요.");

  await recordAudit({
    action: "TEASER_APPROVED",
    entityType: "teasers",
    entityId: view.record.id,
  });
  revalidatePath("/seller/teaser");
  return { ok: true, message: "티저를 승인했습니다." };
}
