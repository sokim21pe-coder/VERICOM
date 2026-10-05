/**
 * Seller Stage 전환 persistence — 단일 write path (`transition_seller_deal_stage` RPC 호출).
 *
 * 권한 검증/원자적 기록(event append + 현재 stage 갱신)은 security-definer RPC(0018)가 담당한다.
 * 유효 stage key 검증은 호출 전 `parseSellerStageTransition`(코드 SoT)이 담당한다.
 * DB를 여기저기서 직접 update하지 않고 이 boundary로 write path를 모은다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkflowStageKey } from "@/lib/deal/standard-workflow";
import type { StageTransitionSource } from "@/lib/deal/seller-stage-transition";

export type SellerStagePersistInput = {
  dealId: string;
  toStageKey: WorkflowStageKey;
  note: string | null;
  source: StageTransitionSource;
};

export type SellerStagePersistResult =
  | { ok: true; eventId: string }
  | {
      ok: false;
      reason: "rls_denied" | "invalid_stage_key" | "transition_failed";
    };

export async function persistSellerStageTransition(
  supabase: SupabaseClient,
  input: SellerStagePersistInput,
): Promise<SellerStagePersistResult> {
  const { data, error } = await supabase.rpc("transition_seller_deal_stage", {
    p_deal_id: input.dealId,
    p_to_stage_key: input.toStageKey,
    p_note: input.note,
    p_source: input.source,
  });

  if (error || !data) {
    if (error?.code === "42501") return { ok: false, reason: "rls_denied" };
    if (error?.code === "23514") {
      return { ok: false, reason: "invalid_stage_key" };
    }
    return { ok: false, reason: "transition_failed" };
  }

  return { ok: true, eventId: data as string };
}
