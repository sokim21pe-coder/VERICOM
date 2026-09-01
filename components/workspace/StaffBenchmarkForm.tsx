"use client";

import { useActionState } from "react";
import {
  submitApprovedEvSalesBenchmark,
  type StaffBenchmarkActionState,
} from "@/lib/valuation/staff-benchmark-actions";
import {
  STAFF_WRITE_METHODS,
  STAFF_WRITE_SOURCE_TYPES,
  type StaffBenchmarkTarget,
} from "@/lib/valuation/staff-benchmark-write";

const initialState: StaffBenchmarkActionState = { ok: true, message: null };

const fieldClass =
  "mt-1 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-navy";

export function StaffBenchmarkForm({
  targets,
}: {
  targets: StaffBenchmarkTarget[];
}) {
  const [state, formAction, pending] = useActionState(
    submitApprovedEvSalesBenchmark,
    initialState,
  );

  if (targets.length === 0) {
    return (
      <p className="mt-8 max-w-2xl text-sm leading-6 text-muted">
        배정된 Deal의 매각 회사가 없습니다. 회사 전체 목록을 열거나 업종 기본
        배수를 만들지 않습니다.
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-8 max-w-xl space-y-5">
      <div>
        <label className="text-xs text-muted" htmlFor="benchmark-company">
          매각 회사 (배정 Deal)
        </label>
        <select
          id="benchmark-company"
          name="companyId"
          required
          defaultValue=""
          className={fieldClass}
        >
          <option value="" disabled>
            선택하세요
          </option>
          {targets.map((item) => (
            <option key={`${item.companyId}:${item.dealId}`} value={item.companyId}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-muted" htmlFor="benchmark-method">
          평가방식
        </label>
        <select
          id="benchmark-method"
          name="method"
          required
          defaultValue=""
          className={fieldClass}
        >
          <option value="" disabled>
            선택하세요
          </option>
          {STAFF_WRITE_METHODS.map((item) => (
            <option key={item} value={item}>
              {item === "EV_EBITDA" ? "EV / EBITDA" : "EV / Sales"}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="text-xs text-muted" htmlFor="benchmark-low">
            Low 배수
          </label>
          <input
            id="benchmark-low"
            name="multipleLow"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className={fieldClass}
          />
        </div>
        <div>
          <label className="text-xs text-muted" htmlFor="benchmark-base">
            Base 배수
          </label>
          <input
            id="benchmark-base"
            name="multipleBase"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className={fieldClass}
          />
        </div>
        <div>
          <label className="text-xs text-muted" htmlFor="benchmark-high">
            High 배수
          </label>
          <input
            id="benchmark-high"
            name="multipleHigh"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            className={fieldClass}
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted" htmlFor="benchmark-source">
          출처
        </label>
        <input
          id="benchmark-source"
          name="source"
          type="text"
          required
          autoComplete="off"
          className={fieldClass}
        />
      </div>
      <div>
        <label className="text-xs text-muted" htmlFor="benchmark-source-type">
          출처 유형
        </label>
        <select
          id="benchmark-source-type"
          name="sourceType"
          required
          defaultValue=""
          className={fieldClass}
        >
          <option value="" disabled>
            선택하세요
          </option>
          {STAFF_WRITE_SOURCE_TYPES.map((item) => (
            <option key={item} value={item}>
              {item === "INTERNAL_REVIEW" ? "내부 검토" : "시장 자료"}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-muted" htmlFor="benchmark-as-of">
          기준일
        </label>
        <input
          id="benchmark-as-of"
          name="asOfDate"
          type="date"
          required
          className={fieldClass}
        />
      </div>
      <div>
        <label className="text-xs text-muted" htmlFor="benchmark-industry">
          업종 (참고, 기본 배수 아님)
        </label>
        <input
          id="benchmark-industry"
          name="industry"
          type="text"
          autoComplete="off"
          className={fieldClass}
        />
      </div>
      <div>
        <label className="text-xs text-muted" htmlFor="benchmark-confidence">
          신뢰도
        </label>
        <select
          id="benchmark-confidence"
          name="confidence"
          required
          defaultValue=""
          className={fieldClass}
        >
          <option value="" disabled>
            선택하세요
          </option>
          <option value="LOW">낮음</option>
          <option value="MEDIUM">중간</option>
          <option value="HIGH">높음</option>
        </select>
      </div>
      <label className="flex items-start gap-2 text-sm leading-6 text-foreground">
        <input
          className="mt-1"
          type="checkbox"
          name="confirmed"
          required
        />
        이 배수는 검증된 자료이며 PLACEHOLDER·추정·LLM·업종 기본값이 아닙니다.
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 items-center justify-center rounded-md bg-navy px-5 text-sm font-medium text-white hover:bg-navy-hover disabled:opacity-60"
      >
        {pending ? "저장 중…" : "승인 비교배수 저장"}
      </button>
      {state?.message ? (
        <p className="text-sm text-muted">{state.message}</p>
      ) : null}
    </form>
  );
}
