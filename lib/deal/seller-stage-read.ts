/**
 * Seller Deal 현재 표준 Stage 읽기 (Deal Access Scope 안에서만).
 *
 * RLS `deals_select_participant` + 서버가 검증한 active Deal id 만 사용하므로
 * 타 Company 사용자가 다른 Seller Deal stage를 읽을 수 없다.
 * 0018 migration 적용 전에도 안전하도록 컬럼 부재(42703)는 NULL로 처리한다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getStandardStageByKey,
  type WorkflowStageKey,
} from "@/lib/deal/standard-workflow";

export type SellerDealStageView = {
  stageKey: WorkflowStageKey | null;
  label: string | null;
};

export const EMPTY_SELLER_STAGE: SellerDealStageView = {
  stageKey: null,
  label: null,
};

export async function readSellerDealStage(
  supabase: SupabaseClient,
  dealId: string,
): Promise<SellerDealStageView> {
  const { data, error } = await supabase
    .from("deals")
    .select("seller_stage_key")
    .eq("id", dealId)
    .maybeSingle();

  // 컬럼 미존재(0018 미적용) 또는 접근 불가 → 미확정(NULL)로 취급한다.
  if (error || !data) return EMPTY_SELLER_STAGE;

  const raw = (data as { seller_stage_key?: unknown }).seller_stage_key;
  const key = typeof raw === "string" && raw.trim() !== "" ? raw.trim() : null;
  if (!key) return EMPTY_SELLER_STAGE;

  const stage = getStandardStageByKey(key);
  if (!stage || stage.side !== "SELLER") return EMPTY_SELLER_STAGE;

  return { stageKey: key as WorkflowStageKey, label: stage.label };
}
