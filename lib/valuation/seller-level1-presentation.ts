import { formatKrwRange } from "@/lib/valuation/format-krw";
import type { NormalizedFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import type {
  BenchmarkApprovalStatus,
  ValuationCalculation,
  ValuationCalculationStatus,
} from "@/types/valuation";
import {
  CALCULATION_ERROR_COPY,
  EQUITY_NOT_CALCULATED_COPY,
  MISSING_FINANCIAL_COPY,
  type SellerLevel0Presentation,
} from "@/lib/valuation/seller-level0-presentation";

export const LEVEL1_TITLE = "LEVEL 1 EV/EBITDA 참고용 가치평가";

export const EV_EBITDA_METHOD_LABEL = "EV / EBITDA";

export const EV_EBITDA_METHOD_EXPLAIN =
  "EV/EBITDA 방식은 회사의 EBITDA에 비교기업이나 유사거래에서 확인된 EBITDA 배수를 적용해 기업가치(EV)를 추정하는 방식입니다. EV/Sales 배수를 그대로 쓰지 않습니다.";

export const MISSING_EBITDA_BENCHMARK_COPY =
  "EBITDA는 정리되었습니다. 기업가치 계산에 필요한 검증된 EV/EBITDA 비교배수가 아직 없습니다.";

export const TOM_LEVEL1_MISSING_EBITDA_COPY =
  "EBITDA가 없어 LEVEL 1 기업가치 금액을 계산하지 않았습니다.";

export const TOM_LEVEL1_MISSING_BENCHMARK_COPY =
  "현재 EBITDA는 확인됐지만, 적용할 EV/EBITDA 비교배수가 아직 확정되지 않아 기업가치 금액은 계산하지 않았습니다.";

export const TOM_LEVEL1_CALCULABLE_EV_ONLY_COPY =
  "평가방식은 EV / EBITDA입니다. 정규화 EBITDA와 승인된 비교배수로 기업가치(Enterprise Value)를 계산했습니다. 기업가치는 지분가치(Equity Value)와 다르며, 순차입이 확인되지 않아 지분가치는 계산하지 않았습니다.";

export const TOM_LEVEL1_CALCULABLE_WITH_EQUITY_COPY =
  "평가방식은 EV / EBITDA입니다. 정규화 EBITDA와 승인된 비교배수로 기업가치(Enterprise Value)를 계산했습니다. 확인된 순차입을 반영한 지분가치(Equity Value)는 기업가치와 다른 값이며 매각가격이 아닙니다.";

function evRangeLabelFrom(result: ValuationCalculation): string | null {
  const low = result.evLow;
  const high = result.evHigh;
  const base = result.evBase ?? result.enterpriseValue;
  if (low != null && high != null) return formatKrwRange(low, high);
  if (base != null) return formatKrwRange(base, base);
  if (low != null) return formatKrwRange(low, null);
  if (high != null) return formatKrwRange(null, high);
  return null;
}

function hasEquityRange(result: ValuationCalculation): boolean {
  const range = result.equityValueRange;
  return range?.low != null || range?.base != null || range?.high != null;
}

function equityCopyFrom(result: ValuationCalculation): string {
  const range = result.equityValueRange;
  const low = range?.low ?? null;
  const base = range?.base ?? null;
  const high = range?.high ?? null;
  if (low == null && base == null && high == null) {
    return EQUITY_NOT_CALCULATED_COPY;
  }
  const label = formatKrwRange(low ?? base, high ?? base);
  return `확인된 순차입을 반영한 지분가치(Equity Value)는 ${label}입니다. 기업가치(EV)와 다른 값이며 매각가격이 아닙니다.`;
}

export function explainSellerLevel1Tom(input: {
  status: ValuationCalculationStatus | null;
  result: ValuationCalculation | null;
  benchmarkApproval: BenchmarkApprovalStatus | null;
}): string {
  const approvedCalculable =
    input.benchmarkApproval === "APPROVED" &&
    input.status === "CALCULABLE" &&
    input.result?.status === "CALCULABLE" &&
    input.result.method === "EV_EBITDA" &&
    input.result.enterpriseValue != null;

  if (approvedCalculable && input.result) {
    return hasEquityRange(input.result)
      ? TOM_LEVEL1_CALCULABLE_WITH_EQUITY_COPY
      : TOM_LEVEL1_CALCULABLE_EV_ONLY_COPY;
  }
  if (input.status === "MISSING_INPUT" || input.status == null) {
    return TOM_LEVEL1_MISSING_EBITDA_COPY;
  }
  if (
    input.status === "NOT_ELIGIBLE" &&
    input.result?.warnings.includes("ebitda_not_positive")
  ) {
    return CALCULATION_ERROR_COPY;
  }
  return TOM_LEVEL1_MISSING_BENCHMARK_COPY;
}

/** Production UI. APPROVED EV/EBITDA + CALCULABLE일 때만 금액 영역을 연다. */
export function sellerLevel1Presentation(input: {
  hasConversation: boolean;
  financials: NormalizedFinancialInputs | null;
  status: ValuationCalculationStatus | null;
  result: ValuationCalculation | null;
  copy: string | null;
  benchmarkApproval: BenchmarkApprovalStatus | null;
}): SellerLevel0Presentation {
  const levelLabel = LEVEL1_TITLE;
  const disclaimer =
    "LEVEL 1 참고용 가치범위이며 정밀 가치평가 결과가 아닙니다. DCF는 사용하지 않습니다.";
  const methodExplanation = EV_EBITDA_METHOD_EXPLAIN;
  const tomExplanation = explainSellerLevel1Tom({
    status: input.status,
    result: input.result,
    benchmarkApproval: input.benchmarkApproval,
  });
  const approvedCalculable =
    input.benchmarkApproval === "APPROVED" &&
    input.status === "CALCULABLE" &&
    input.result?.status === "CALCULABLE" &&
    input.result.method === "EV_EBITDA" &&
    input.result.enterpriseValue != null;

  if (!input.hasConversation) {
    return {
      statusLabel: "데이터 없음",
      copy: "상담에서 EBITDA를 입력하면 LEVEL 1 상태를 확인할 수 있습니다.",
      showEnterpriseValue: false,
      methodLabel: null,
      methodExplanation,
      evRangeLabel: null,
      sourceLabel: null,
      levelLabel,
      disclaimer,
      equityCopy: null,
      tomExplanation: "상담에서 EBITDA를 입력하면 LEVEL 1 상태를 확인할 수 있습니다.",
    };
  }

  const missingEbitda =
    input.status === "MISSING_INPUT" ||
    !input.financials ||
    input.financials.ebitda.unresolved ||
    input.financials.ebitda.krw == null;

  if (missingEbitda) {
    return {
      statusLabel: "재무정보 입력 필요",
      copy: MISSING_FINANCIAL_COPY,
      showEnterpriseValue: false,
      methodLabel: null,
      methodExplanation,
      evRangeLabel: null,
      sourceLabel: null,
      levelLabel,
      disclaimer,
      equityCopy: null,
      tomExplanation: TOM_LEVEL1_MISSING_EBITDA_COPY,
    };
  }

  if (input.status === "NOT_ELIGIBLE") {
    const ebitdaBad = input.result?.warnings.includes("ebitda_not_positive");
    if (ebitdaBad) {
      return {
        statusLabel: "계산 불가",
        copy: CALCULATION_ERROR_COPY,
        showEnterpriseValue: false,
        methodLabel: EV_EBITDA_METHOD_LABEL,
        methodExplanation,
        evRangeLabel: null,
        sourceLabel: null,
        levelLabel,
        disclaimer,
        equityCopy: null,
        tomExplanation,
      };
    }
  }

  if (approvedCalculable && input.result) {
    const range = evRangeLabelFrom(input.result);
    return {
      statusLabel: "Indicative EV 계산됨",
      copy:
        input.copy ??
        `평가방식: ${EV_EBITDA_METHOD_LABEL}. 기업가치(Enterprise Value) 범위: ${range}. 기준: 승인된 비교배수.`,
      showEnterpriseValue: true,
      methodLabel: EV_EBITDA_METHOD_LABEL,
      methodExplanation,
      evRangeLabel: range,
      sourceLabel: "승인된 비교배수",
      levelLabel,
      disclaimer,
      equityCopy: equityCopyFrom(input.result),
      tomExplanation,
    };
  }

  return {
    statusLabel: "비교배수 확인 필요",
    copy: input.copy ?? MISSING_EBITDA_BENCHMARK_COPY,
    showEnterpriseValue: false,
    methodLabel: EV_EBITDA_METHOD_LABEL,
    methodExplanation,
    evRangeLabel: null,
    sourceLabel: null,
    levelLabel,
    disclaimer,
    equityCopy: null,
    tomExplanation,
  };
}
