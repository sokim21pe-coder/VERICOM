import type { NormalizedFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import type {
  FinancialInput,
  ValuationBenchmark,
  ValuationCalculation,
  ValuationCalculationMode,
  ValuationMultipleUsed,
} from "@/types/valuation";

export const MISSING_BENCHMARK_SELLER_COPY =
  "재무 입력은 정리되었습니다. 검증된 비교배수(EV/Sales)가 없어 기업가치 금액을 계산하거나 표시하지 않습니다.";

export function toFinancialInput(
  financials: NormalizedFinancialInputs,
): FinancialInput {
  return {
    revenueKrw: financials.revenue.krw,
    revenueUnresolved: financials.revenue.unresolved,
    industry: financials.industry,
  };
}

export function evSalesIntegerKrw(revenueKrw: number, multiple: number): number {
  return Math.round(revenueKrw * multiple);
}

function emptyResult(
  partial: Omit<ValuationCalculation, "method" | "equityValueRange" | "calculatedAt"> & {
    calculatedAt?: string;
  },
  calculatedAt: string,
): ValuationCalculation {
  return {
    method: "EV_SALES",
    equityValueRange: null,
    calculatedAt,
    ...partial,
  };
}

function resolveMultiples(benchmark: ValuationBenchmark): ValuationMultipleUsed {
  const base = benchmark.multipleBase ?? benchmark.multiple;
  return {
    low: benchmark.multipleLow,
    base,
    high: benchmark.multipleHigh,
  };
}

function positiveMultiple(value: number | null): value is number {
  return value != null && Number.isFinite(value) && value > 0;
}

function canUseBenchmark(
  benchmark: ValuationBenchmark,
  mode: ValuationCalculationMode,
): { ok: true } | { ok: false; warning: string } {
  if (benchmark.method !== "EV_SALES") {
    return { ok: false, warning: "method_not_ev_sales" };
  }
  if (benchmark.approvalStatus === "UNVERIFIED") {
    return { ok: false, warning: "unverified_benchmark_rejected" };
  }
  if (benchmark.approvalStatus === "TEST_ONLY" && mode === "production") {
    return { ok: false, warning: "test_only_forbidden_in_production" };
  }
  if (
    benchmark.approvalStatus !== "APPROVED" &&
    benchmark.approvalStatus !== "TEST_ONLY"
  ) {
    return { ok: false, warning: "benchmark_not_approved" };
  }
  return { ok: true };
}

export function calculateEvSales(input: {
  financials: NormalizedFinancialInputs | FinancialInput;
  benchmark: ValuationBenchmark | null;
  mode: ValuationCalculationMode;
  now?: Date;
}): ValuationCalculation {
  const calculatedAt = (input.now ?? new Date()).toISOString();
  const financial: FinancialInput =
    "revenue" in input.financials
      ? toFinancialInput(input.financials)
      : input.financials;

  if (financial.revenueUnresolved) {
    return emptyResult(
      {
        status: "MISSING_INPUT",
        revenueKrw: null,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: ["EV/Sales requires resolved positive revenue"],
        warnings: ["revenue_unresolved"],
        sources: [],
      },
      calculatedAt,
    );
  }

  if (financial.revenueKrw == null) {
    return emptyResult(
      {
        status: "MISSING_INPUT",
        revenueKrw: null,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: ["EV/Sales requires resolved positive revenue"],
        warnings: ["revenue_missing"],
        sources: [],
      },
      calculatedAt,
    );
  }

  if (financial.revenueKrw <= 0) {
    return emptyResult(
      {
        status: "NOT_ELIGIBLE",
        revenueKrw: financial.revenueKrw,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: ["EV/Sales requires revenue greater than zero"],
        warnings: ["revenue_not_positive"],
        sources: [],
      },
      calculatedAt,
    );
  }

  if (!input.benchmark) {
    return emptyResult(
      {
        status: "MISSING_BENCHMARK",
        revenueKrw: financial.revenueKrw,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: [
          "Normalized revenue is present",
          "Approved EV/Sales multiple is required",
        ],
        warnings: ["missing_benchmark"],
        sources: [],
      },
      calculatedAt,
    );
  }

  const usable = canUseBenchmark(input.benchmark, input.mode);
  if (!usable.ok) {
    return emptyResult(
      {
        status: "NOT_ELIGIBLE",
        revenueKrw: financial.revenueKrw,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: ["Production calculation accepts APPROVED benchmarks only"],
        warnings: [usable.warning],
        sources: [input.benchmark.source],
      },
      calculatedAt,
    );
  }

  const multiples = resolveMultiples(input.benchmark);
  if (
    !positiveMultiple(multiples.base) &&
    !positiveMultiple(multiples.low) &&
    !positiveMultiple(multiples.high)
  ) {
    return emptyResult(
      {
        status: "MISSING_BENCHMARK",
        revenueKrw: financial.revenueKrw,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: ["Benchmark must include a positive EV/Sales multiple"],
        warnings: ["benchmark_multiple_missing"],
        sources: [input.benchmark.source],
      },
      calculatedAt,
    );
  }

  const evLow = positiveMultiple(multiples.low)
    ? evSalesIntegerKrw(financial.revenueKrw, multiples.low)
    : null;
  const evBase = positiveMultiple(multiples.base)
    ? evSalesIntegerKrw(financial.revenueKrw, multiples.base)
    : null;
  const evHigh = positiveMultiple(multiples.high)
    ? evSalesIntegerKrw(financial.revenueKrw, multiples.high)
    : null;
  const enterpriseValue = evBase ?? evLow ?? evHigh;

  return emptyResult(
    {
      status: "CALCULABLE",
      revenueKrw: financial.revenueKrw,
      enterpriseValue,
      evLow,
      evBase,
      evHigh,
      multipleUsed: multiples,
      assumptions: [
        "EV = Normalized Revenue × EV/Sales Multiple",
        "Equity Value is not calculated without a Net Debt engine",
        `Benchmark approvalStatus=${input.benchmark.approvalStatus}`,
      ],
      warnings: [],
      sources: [input.benchmark.source],
    },
    calculatedAt,
  );
}

/** Seller UI. APPROVED가 아니면 기업가치 금액을 넣지 않는다. TEST_ONLY 결과는 노출하지 않는다. */
export function formatSellerLevel0Copy(
  result: ValuationCalculation,
  benchmark: ValuationBenchmark | null,
): string {
  const approved =
    benchmark?.approvalStatus === "APPROVED" && result.status === "CALCULABLE";
  if (approved && result.enterpriseValue != null) {
    return `검증된 EV/Sales 배수로 계산한 기업가치(Enterprise Value)는 ${result.enterpriseValue}원입니다. 지분가치(Equity Value)는 순차입 엔진이 없어 계산하지 않습니다.`;
  }
  if (result.status === "MISSING_INPUT") {
    return "기업가치를 계산하려면 정규화된 매출이 필요합니다.";
  }
  if (
    result.status === "NOT_ELIGIBLE" &&
    result.warnings.includes("revenue_not_positive")
  ) {
    return "현재 재무 입력으로는 EV/Sales 기업가치를 계산할 수 없습니다.";
  }
  return MISSING_BENCHMARK_SELLER_COPY;
}
