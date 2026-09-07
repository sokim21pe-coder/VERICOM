"use client";

import { useActionState } from "react";
import {
  confirmSellerDealStage,
  type SellerStageFormState,
} from "@/lib/deal/seller-stage-actions";
import { SELLER_WORKFLOW_STAGES } from "@/lib/deal/standard-workflow";

const initialState: SellerStageFormState = { ok: true, message: null };

/**
 * 현재 거래 단계 표시 + 권한 있는 사용자의 명시적 단계 확정.
 * 선택지는 Standard Workflow SoT(SELLER_WORKFLOW_STAGES)에서만 가져온다(하드코딩 금지).
 * Progress bar / Timeline / 13-step UI / 자동 다음단계는 만들지 않는다.
 */
export function SellerStagePanel({
  currentLabel,
  currentStageKey,
  canWrite,
}: {
  currentLabel: string | null;
  currentStageKey: string | null;
  canWrite: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    confirmSellerDealStage,
    initialState,
  );

  return (
    <section className="mt-8 max-w-xl rounded-lg border border-line bg-surface-subtle px-5 py-4">
      <h2 className="text-xs font-semibold tracking-[0.14em] text-navy">
        현재 거래 단계
      </h2>
      <p className="mt-2 text-base font-medium text-foreground">
        {currentLabel ?? "아직 거래 단계가 확정되지 않았습니다."}
      </p>

      {canWrite ? (
        <form action={formAction} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1">
            <label
              htmlFor="seller-stage-select"
              className="text-xs text-muted"
            >
              단계 선택
            </label>
            <select
              id="seller-stage-select"
              name="toStageKey"
              required
              defaultValue={currentStageKey ?? ""}
              className="mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-navy"
            >
              <option value="" disabled>
                단계를 선택하세요
              </option>
              {SELLER_WORKFLOW_STAGES.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.order}. {stage.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-md bg-navy px-5 text-sm font-medium text-white hover:bg-navy-hover disabled:opacity-60"
          >
            {pending ? "저장 중…" : "거래 단계 확정"}
          </button>
        </form>
      ) : null}

      {state?.message ? (
        <p className="mt-3 text-sm text-muted">{state.message}</p>
      ) : null}
    </section>
  );
}
