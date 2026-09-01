import { formatKrwRange } from "@/lib/valuation/format-krw";
import type { NormalizedFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import type {
  BenchmarkApprovalStatus,
  ValuationCalculation,
  ValuationCalculationStatus,
} from "@/types/valuation";

export const LEVEL0_TITLE = "LEVEL 0 초기 참고용 가치평가";

export const LEVEL0_DISCLAIMER =
  "초기 참고용 가치범위이며 정밀 가치평가 결과가 아닙니다.";

export const EV_SALES_METHOD_LABEL = "EV / Sales";

export const EV_SALES_METHOD_EXPLAIN =
  "EV/Sales 방식은 회사의 매출액에 비교기업이나 유사거래에서 확인된 매출배수를 적용해 기업가치(EV)를 추정하는 방식입니다.";

export const MISSING_FINANCIAL_COPY = "재무정보 입력 필요";

export const MISSING_BENCHMARK_SELLER_COPY =
  "재무정보는 정리되었습니다. 기업가치 계산에 필요한 검증된 비교배수가 아직 없습니다.";

export const CALCULATION_ERROR_COPY = "계산 불가 — 입력정보 확인 필요";

export const APPROVED_SOURCE_LABEL = "승인된 비교배수";

export const EQUITY_NOT_CALCULATED_COPY =
  "이번 결과는 기업가치(Enterprise Value)입니다. 매각가격이나 주식가치(Equity Value)가 아닙니다. 순차입이 확인되지 않아 지분가치는 계산하지 않았습니다.";

export const TOM_MISSING_INPUT_COPY =
  "재무정보가 없어 기업가치 금액을 계산하지 않았습니다.";

export const TOM_MISSING_BENCHMARK_COPY =
  "현재 매출정보는 확인됐지만, 적용할 비교배수가 아직 확정되지 않아 기업가치 금액은 계산하지 않았습니다.";

export const TOM_CALCULATION_ERROR_COPY =
  "입력정보를 확인할 수 없어 기업가치 금액을 계산하지 않았습니다.";

export const TOM_CALCULABLE_EV_ONLY_COPY =
  "평가방식은 EV / Sales입니다. 정규화 매출과 승인된 비교배수로 기업가치(Enterprise Value)를 계산했습니다. 기업가치는 지분가치(Equity Value)와 다르며, 순차입이 확인되지 않아 지분가치는 계산하지 않았습니다.";

export const TOM_CALCULABLE_WITH_EQUITY_COPY =
  "평가방식은 EV / Sales입니다. 정규화 매출과 승인된 비교배수로 기업가치(Enterprise Value)를 계산했습니다. 확인된 순차입을 반영한 지분가치(Equity Value)는 기업가치와 다른 값이며 매각가격이 아닙니다.";

export type SellerLevel0StatusLabel =
  | "재무정보 입력 필요"
  | "비교배수 확인 필요"
  | "Indicative EV 계산됨"
  | "계산 불가"
  | "데이터 없음";

export type ValuationFlowStepState = "done" | "current" | "todo";

export type ValuationFlowStep = {
  id: string;
  label: string;
  state: ValuationFlowStepState;
};

export type SellerLevel0Presentation = {
  statusLabel: SellerLevel0StatusLabel;
  copy: string;
  showEnterpriseValue: boolean;
  methodLabel: string | null;
  methodExplanation: string | null;
  evRangeLabel: string | null;
  sourceLabel: string | null;
  levelLabel: string;
  disclaimer: string;
  equityCopy: string | null;
  tomExplanation: string;
  progressLabel?: string;
  flowSteps?: ValuationFlowStep[];
  missingItems?: string[];
  multipleLowLabel?: string | null;
  multipleBaseLabel?: string | null;
  multipleHighLabel?: string | null;
};

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

/** TOM 결정론 설명. 새 숫자를 만들지 않는다. LLM을 쓰지 않는다. */
export function explainSellerLevel0Tom(input: {
  status: ValuationCalculationStatus | null;
  result: ValuationCalculation | null;
  benchmarkApproval: BenchmarkApprovalStatus | null;
}): string {
  const approvedCalculable =
    input.benchmarkApproval === "APPROVED" &&
    input.status === "CALCULABLE" &&
    input.result?.status === "CALCULABLE" &&
    input.result.enterpriseValue != null;

  if (approvedCalculable && input.result) {
    return hasEquityRange(input.result)
      ? TOM_CALCULABLE_WITH_EQUITY_COPY
      : TOM_CALCULABLE_EV_ONLY_COPY;
  }
  if (input.status === "MISSING_INPUT" || input.status == null) {
    return TOM_MISSING_INPUT_COPY;
  }
  if (
    input.status === "NOT_ELIGIBLE" &&
    input.result?.warnings.includes("revenue_not_positive")
  ) {
    return TOM_CALCULATION_ERROR_COPY;
  }
  return TOM_MISSING_BENCHMARK_COPY;
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

/** Production UI. APPROVED + CALCULABLE일 때만 금액 영역을 연다. */
export function sellerLevel0Presentation(input: {
  hasConversation: boolean;
  financials: NormalizedFinancialInputs | null;
  status: ValuationCalculationStatus | null;
  result: ValuationCalculation | null;
  copy: string | null;
  benchmarkApproval: BenchmarkApprovalStatus | null;
}): SellerLevel0Presentation {
  const levelLabel = LEVEL0_TITLE;
  const disclaimer = LEVEL0_DISCLAIMER;
  const methodExplanation = EV_SALES_METHOD_EXPLAIN;
  const approvedCalculable =
    input.benchmarkApproval === "APPROVED" &&
    input.status === "CALCULABLE" &&
    input.result?.status === "CALCULABLE" &&
    input.result.enterpriseValue != null;

  const tomExplanation = explainSellerLevel0Tom({
    status: input.status,
    result: input.result,
    benchmarkApproval: input.benchmarkApproval,
  });

  if (!input.hasConversation) {
    return {
      statusLabel: "데이터 없음",
      copy: "상담에서 재무를 입력하면 가치평가 상태를 확인할 수 있습니다.",
      showEnterpriseValue: false,
      methodLabel: EV_SALES_METHOD_LABEL,
      methodExplanation,
      evRangeLabel: null,
      sourceLabel: null,
      levelLabel,
      disclaimer,
      equityCopy: null,
      tomExplanation: "상담에서 재무를 입력하면 가치평가 상태를 확인할 수 있습니다.",
    };
  }

  const missingRevenue =
    input.status === "MISSING_INPUT" ||
    !input.financials ||
    input.financials.completeness.knownInputs === 0 ||
    input.financials.revenue.unresolved ||
    input.financials.revenue.krw == null;

  if (missingRevenue) {
    return {
      statusLabel: "재무정보 입력 필요",
      copy: MISSING_FINANCIAL_COPY,
      showEnterpriseValue: false,
      methodLabel: EV_SALES_METHOD_LABEL,
      methodExplanation,
      evRangeLabel: null,
      sourceLabel: null,
      levelLabel,
      disclaimer,
      equityCopy: null,
      tomExplanation: TOM_MISSING_INPUT_COPY,
    };
  }

  if (input.status === "NOT_ELIGIBLE") {
    const revenueBad = input.result?.warnings.includes("revenue_not_positive");
    if (revenueBad) {
      return {
        statusLabel: "계산 불가",
        copy: CALCULATION_ERROR_COPY,
        showEnterpriseValue: false,
        methodLabel: EV_SALES_METHOD_LABEL,
        methodExplanation,
        evRangeLabel: null,
        sourceLabel: null,
        levelLabel,
        disclaimer,
        equityCopy: null,
        tomExplanation: TOM_CALCULATION_ERROR_COPY,
      };
    }
  }

  if (approvedCalculable && input.result) {
    const range = evRangeLabelFrom(input.result);
    return {
      statusLabel: "Indicative EV 계산됨",
      copy:
        input.copy ??
        `평가방식: ${EV_SALES_METHOD_LABEL}. 기업가치(Enterprise Value) 범위: ${range}. 기준: ${APPROVED_SOURCE_LABEL}.`,
      showEnterpriseValue: true,
      methodLabel: EV_SALES_METHOD_LABEL,
      methodExplanation,
      evRangeLabel: range,
      sourceLabel: APPROVED_SOURCE_LABEL,
      levelLabel,
      disclaimer,
      equityCopy: equityCopyFrom(input.result),
      tomExplanation,
    };
  }

  return {
    statusLabel: "비교배수 확인 필요",
    copy: input.copy ?? MISSING_BENCHMARK_SELLER_COPY,
    showEnterpriseValue: false,
    methodLabel: EV_SALES_METHOD_LABEL,
    methodExplanation,
    evRangeLabel: null,
    sourceLabel: null,
    levelLabel,
    disclaimer,
    equityCopy: null,
    tomExplanation,
  };
}
