import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getExistingTomConversation,
  getNormalizedFinancialInputs,
} from "@/lib/tom/actions";
import {
  canApproveTeaser,
  canCreateTeaser,
  canEditTeaser,
  canViewTeaser,
} from "@/lib/teaser/access";
import { buildTeaserDraft, type TeaserMemoryInput } from "@/lib/teaser/draft";
import type {
  TeaserContent,
  TeaserRecord,
  TeaserStatus,
} from "@/lib/teaser/types";
import { TEASER_STATUSES } from "@/lib/teaser/types";
import type { CurrentContext } from "@/types/context";

// Teaser 읽기 레이어.
// - 마이그레이션(0020) 미적용이어도 깨지지 않는다: 테이블 없으면 record=null, storageReady=false.
// - 프리뷰(Draft)는 테이블 없이도 확인된 사실만으로 항상 생성한다.
// - 서버 CurrentContext로만 권한을 판단한다.

export type TeaserWorkspaceView = {
  configured: boolean;
  companyId: string | null;
  companyName: string | null;
  conversationId: string | null;
  dealId: string | null;
  canCreate: boolean;
  canEdit: boolean;
  canApprove: boolean;
  /** DB에 저장된 Teaser(현재 버전). 없으면 null(작성 전). */
  record: TeaserRecord | null;
  /** 최신 확인 사실로 생성한 Draft 프리뷰. 저장 전/빈 상태에서도 노출. */
  preview: TeaserContent;
  /** 영속화 가능 여부(0020 적용 시 true). false면 UI는 안내만 한다. */
  storageReady: boolean;
  /** 확인 필요(UNKNOWN) 라벨. 사용자 안내용. */
  missing: string[];
};

function asStatus(value: unknown): TeaserStatus {
  return TEASER_STATUSES.includes(value as TeaserStatus)
    ? (value as TeaserStatus)
    : "DRAFT";
}

function rowToRecord(row: Record<string, unknown>): TeaserRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    dealId: (row.deal_id as string | null) ?? null,
    status: asStatus(row.status),
    currentVersion: Number(row.current_version ?? 1),
    approvedVersion:
      row.approved_version == null ? null : Number(row.approved_version),
    approvedAt: (row.approved_at as string | null) ?? null,
    content: (row.content as TeaserContent) ?? null,
    identityMasked: Boolean(row.identity_masked),
    maskedDescriptor: (row.masked_descriptor as string | null) ?? null,
    updatedAt: (row.updated_at as string | null) ?? null,
  } as TeaserRecord;
}

export async function loadSellerTeaserView(
  context: CurrentContext,
): Promise<TeaserWorkspaceView> {
  const companyId = context.company?.id ?? null;
  const companyName = context.company?.name ?? null;

  // 상담(sell) 대화 + 메모리 + 정규화 매출 로드.
  const started = await getExistingTomConversation("sell");
  const conversation = started.ok ? started.conversation : null;
  const memories: TeaserMemoryInput[] = (started.ok ? started.memories : []).map(
    (item) => ({
      key: item.key,
      value: item.value,
      informationState: item.informationState,
    }),
  );

  let revenueKrw: number | null = null;
  if (conversation) {
    const normalized = await getNormalizedFinancialInputs(conversation.id);
    revenueKrw = normalized.ok ? normalized.inputs?.revenue.krw ?? null : null;
  }

  const preview = buildTeaserDraft({
    companyName,
    companyIndustry: context.company?.industry ?? null,
    memories,
    revenueKrw,
    identityReleased: false,
  });

  const base: TeaserWorkspaceView = {
    configured: isSupabaseConfigured(),
    companyId,
    companyName,
    conversationId: conversation?.id ?? null,
    dealId: context.deal?.id ?? null,
    canCreate: canCreateTeaser(context),
    canEdit: companyId ? canEditTeaser(context, companyId) : false,
    canApprove: companyId ? canApproveTeaser(context, companyId) : false,
    record: null,
    preview,
    storageReady: false,
    missing: preview.missing,
  };

  if (!base.configured || !companyId) {
    return base;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return base;

  // 테이블이 없으면(0020 미적용) 에러가 나며, 이때는 storageReady=false로 우아하게 처리.
  let query = supabase
    .from("teasers")
    .select(
      "id, company_id, deal_id, conversation_id, status, current_version, approved_version, approved_at, identity_masked, masked_descriptor, headline, content, updated_at",
    )
    .eq("company_id", companyId);
  query = conversation?.id
    ? query.eq("conversation_id", conversation.id)
    : query.is("conversation_id", null);

  const { data, error } = await query.maybeSingle();

  if (error) {
    // undefined_table(42P01) 등: 저장소 미준비. 프리뷰만 제공.
    return base;
  }

  const storageReady = true;
  const record = data ? rowToRecord(data as Record<string, unknown>) : null;

  // 조회 권한 재확인(RLS가 1차, 여기가 2차 방어).
  if (record && !canViewTeaser(context, record.companyId)) {
    return { ...base, storageReady, record: null };
  }

  return {
    ...base,
    storageReady,
    record,
    missing: record?.content?.missing ?? preview.missing,
  };
}
