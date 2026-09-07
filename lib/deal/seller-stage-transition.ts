/**
 * Seller Standard Workflow Stage 전환 — 순수 검증/권한 판정 (DB 미접근).
 *
 * 코드 SoT: `lib/deal/standard-workflow.ts`. 유효 Seller stage key(13개)의 정확한 검증은
 * 여기서 수행한다(DB는 형태 guard만). Buyer stage는 대상이 아니다.
 *
 * Stage 전환의 Source of Truth는 사용자 행동/승인/운영자 행동이다. 이 모듈은
 * 자동 진행/AI 확정을 하지 않으며, 순서 강제(Mandate 필수 등) Hard Constraint도 두지 않는다
 * (Deal-specific Adjustment 대비).
 */

import type { CurrentContext } from "@/types/context";
import { DealRole } from "@/types/enums";
import {
  getStandardStageByKey,
  type WorkflowStageKey,
} from "@/lib/deal/standard-workflow";

/** Seller Deal stage 전환을 실행할 수 있는 Deal Role. Advisor는 이번 단계에서 제외(보수적). */
export const SELLER_STAGE_WRITE_ROLES: readonly DealRole[] = [
  DealRole.SELLER_OWNER,
  DealRole.SELLER_OPERATOR,
  DealRole.INTERNAL_MANAGER,
];

export const STAGE_TRANSITION_SOURCES = [
  "USER_ACTION",
  "STAFF_ACTION",
  "SYSTEM",
] as const;
export type StageTransitionSource = (typeof STAGE_TRANSITION_SOURCES)[number];

export type SellerStageTransitionReason =
  | "auth_required"
  | "deal_mismatch"
  | "permission_denied"
  | "invalid_stage_key"
  | "invalid_source";

export type SellerStageTransitionInput = {
  dealId: string;
  toStageKey: string;
  note?: string | null;
  source?: string | null;
};

export type ParsedSellerStageTransition =
  | {
      ok: true;
      dealId: string;
      toStageKey: WorkflowStageKey;
      note: string | null;
      source: StageTransitionSource;
    }
  | { ok: false; reason: SellerStageTransitionReason };

/** key가 Seller side의 유효한 표준 stage key인지 (코드 SoT 기준). */
export function isValidSellerStageKey(key: string): key is WorkflowStageKey {
  const stage = getStandardStageByKey(key.trim());
  return Boolean(stage && stage.side === "SELLER");
}

/** 현재 Context가 해당 Deal의 Seller stage를 전환할 수 있는지. Buyer 역할/타 Deal은 불가. */
export function canContextTransitionSellerStage(
  context: CurrentContext | null,
  dealId: string,
): boolean {
  if (!context) return false;
  const id = dealId.trim();
  if (!id || !context.deal || context.deal.id !== id) return false;
  return Boolean(
    context.dealRole && SELLER_STAGE_WRITE_ROLES.includes(context.dealRole),
  );
}

function asTransitionSource(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? "USER_ACTION" : trimmed;
}

/**
 * 서버 write boundary가 사용하는 단일 검증 진입점.
 * 인증 → Deal 일치 → 권한 → 유효 stage key → source 순으로 판정한다.
 * 실제 Stage 값/DB는 여기서 바꾸지 않는다.
 */
export function parseSellerStageTransition(
  context: CurrentContext | null,
  input: SellerStageTransitionInput,
): ParsedSellerStageTransition {
  if (!context) return { ok: false, reason: "auth_required" };

  const dealId = (input.dealId ?? "").trim();
  if (!dealId || !context.deal || context.deal.id !== dealId) {
    return { ok: false, reason: "deal_mismatch" };
  }

  if (
    !context.dealRole ||
    !SELLER_STAGE_WRITE_ROLES.includes(context.dealRole)
  ) {
    return { ok: false, reason: "permission_denied" };
  }

  const toStageKey = (input.toStageKey ?? "").trim();
  if (!isValidSellerStageKey(toStageKey)) {
    return { ok: false, reason: "invalid_stage_key" };
  }

  const source = asTransitionSource(input.source);
  if (!STAGE_TRANSITION_SOURCES.includes(source as StageTransitionSource)) {
    return { ok: false, reason: "invalid_source" };
  }

  const noteRaw = typeof input.note === "string" ? input.note.trim() : "";

  return {
    ok: true,
    dealId,
    toStageKey,
    note: noteRaw === "" ? null : noteRaw,
    source: source as StageTransitionSource,
  };
}
