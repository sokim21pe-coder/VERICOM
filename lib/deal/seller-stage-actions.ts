"use server";

/**
 * Seller Stage 전환 서버 boundary — `transitionSellerDealStage`.
 *
 * Understand → Validate(권한/stage key) → Execute(단일 RPC write path) → Record(audit).
 * UI 호출 연결은 이번 Phase에서 필수가 아니지만, write path가 분산되지 않도록 이 함수로 모은다.
 * Stage 전환은 명시적 호출로만 발생하며 자동 진행/AI 확정을 하지 않는다.
 */

import { recordAudit } from "@/lib/audit";
import { authErrorMessage } from "@/lib/auth/errors";
import { getCurrentContext } from "@/lib/auth/session";
import {
  parseSellerStageTransition,
  type SellerStageTransitionInput,
} from "@/lib/deal/seller-stage-transition";
import { persistSellerStageTransition } from "@/lib/deal/seller-stage-persistence";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ErrorCode } from "@/types/enums";

export type SellerStageTransitionResult =
  | { ok: true; eventId: string; message: string }
  | { ok: false; message: string };

export async function transitionSellerDealStage(
  input: SellerStageTransitionInput,
): Promise<SellerStageTransitionResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
    };
  }

  const context = await getCurrentContext();
  const parsed = parseSellerStageTransition(context, input);
  if (!parsed.ok) {
    if (parsed.reason === "auth_required") {
      return { ok: false, message: authErrorMessage[ErrorCode.AUTH_REQUIRED] };
    }
    if (parsed.reason === "deal_mismatch" || parsed.reason === "permission_denied") {
      return {
        ok: false,
        message: authErrorMessage[ErrorCode.PERMISSION_DENIED],
      };
    }
    return { ok: false, message: authErrorMessage[ErrorCode.VALIDATION_ERROR] };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
    };
  }

  const persisted = await persistSellerStageTransition(supabase, {
    dealId: parsed.dealId,
    toStageKey: parsed.toStageKey,
    note: parsed.note,
    source: parsed.source,
  });

  if (!persisted.ok) {
    if (persisted.reason === "rls_denied") {
      return {
        ok: false,
        message: authErrorMessage[ErrorCode.PERMISSION_DENIED],
      };
    }
    if (persisted.reason === "invalid_stage_key") {
      return {
        ok: false,
        message: authErrorMessage[ErrorCode.VALIDATION_ERROR],
      };
    }
    return {
      ok: false,
      message: "단계를 전환하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }

  await recordAudit({
    action: "SELLER_DEAL_STAGE_TRANSITION",
    entityType: "deals",
    entityId: parsed.dealId,
  });

  return {
    ok: true,
    eventId: persisted.eventId,
    message: "현재 단계를 저장했습니다.",
  };
}
