import type { NormalizedFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import { formatKrw, formatKrwRange } from "@/lib/valuation/format-krw";
import {
  computeEquityValueRange,
  toFinancialInput,
} from "@/lib/valuation/ev-sales";
import {
  CALCULATION_ERROR_COPY,
  EQUITY_NOT_CALCULATED_COPY,
  MISSING_FINANCIAL_COPY,
} from "@/lib/valuation/seller-level0-presentation";
import {
  EV_EBITDA_METHOD_LABEL,
  MISSING_EBITDA_BENCHMARK_COPY,
} from "@/lib/valuation/seller-level1-presentation";
import type {
  FinancialInput,
  ValuationBenchmark,
  ValuationCalculation,
  ValuationCalculationMode,
  ValuationMultipleUsed,
} from "@/types/valuation";

export const MISSING_NET_DEBT_EQUITY_COPY = EQUITY_NOT_CALCULATED_COPY;

export function evEbitdaIntegerKrw(ebitdaKrw: number, multiple: number): number {
  return Math.round(ebitdaKrw * multiple);
}

function emptyResult(
  partial: Omit<ValuationCalculation, "method" | "equityValueRange" | "calculatedAt"> & {
    calculatedAt?: string;
    equityValueRange?: ValuationCalculation["equityValueRange"];
  },
  calculatedAt: string,
): ValuationCalculation {
  return {
    method: "EV_EBITDA",
    equityValueRange: null,
    calculatedAt,
    ...partial,
  };
}

function resolveFinancialInput(
  financials: NormalizedFinancialInputs | FinancialInput,
): FinancialInput {
  if ("ebitda" in financials && "revenue" in financials) {
    return toFinancialInput(financials);
  }
  return {
    revenueKrw: financials.revenueKrw,
    revenueUnresolved: financials.revenueUnresolved,
    industry: financials.industry,
    ebitdaKrw: financials.ebitdaKrw ?? null,
    ebitdaUnresolved: financials.ebitdaUnresolved ?? false,
    netDebtKrw: financials.netDebtKrw ?? null,
    netDebtUnresolved: financials.netDebtUnresolved ?? false,
    netDebtConfidence: financials.netDebtConfidence ?? null,
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
  if (benchmark.method !== "EV_EBITDA") {
    return { ok: false, warning: "method_not_ev_ebitda" };
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

export function calculateEvEbitda(input: {
  financials: NormalizedFinancialInputs | FinancialInput;
  benchmark: ValuationBenchmark | null;
  mode: ValuationCalculationMode;
  now?: Date;
}): ValuationCalculation {
  const calculatedAt = (input.now ?? new Date()).toISOString();
  const financial = resolveFinancialInput(input.financials);

  if (financial.ebitdaUnresolved) {
    return emptyResult(
      {
        status: "MISSING_INPUT",
        revenueKrw: financial.revenueKrw,
        ebitdaKrw: null,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: ["EV/EBITDA requires resolved positive EBITDA"],
        warnings: ["ebitda_unresolved"],
        sources: [],
      },
      calculatedAt,
    );
  }

  if (financial.ebitdaKrw == null) {
    return emptyResult(
      {
        status: "MISSING_INPUT",
        revenueKrw: financial.revenueKrw,
        ebitdaKrw: null,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: ["EV/EBITDA requires resolved positive EBITDA"],
        warnings: ["ebitda_missing"],
        sources: [],
      },
      calculatedAt,
    );
  }

  if (financial.ebitdaKrw <= 0) {
    return emptyResult(
      {
        status: "NOT_ELIGIBLE",
        revenueKrw: financial.revenueKrw,
        ebitdaKrw: financial.ebitdaKrw,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: ["EV/EBITDA requires EBITDA greater than zero"],
        warnings: ["ebitda_not_positive"],
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
        ebitdaKrw: financial.ebitdaKrw,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: [
          "Normalized EBITDA is present",
          "Approved EV/EBITDA multiple is required",
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
        ebitdaKrw: financial.ebitdaKrw,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: ["Production calculation accepts APPROVED EV/EBITDA benchmarks only"],
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
        ebitdaKrw: financial.ebitdaKrw,
        enterpriseValue: null,
        evLow: null,
        evBase: null,
        evHigh: null,
        multipleUsed: null,
        assumptions: ["Benchmark must include a positive EV/EBITDA multiple"],
        warnings: ["benchmark_multiple_missing"],
        sources: [input.benchmark.source],
      },
      calculatedAt,
    );
  }

  const evLow = positiveMultiple(multiples.low)
    ? evEbitdaIntegerKrw(financial.ebitdaKrw, multiples.low)
    : null;
  const evBase = positiveMultiple(multiples.base)
    ? evEbitdaIntegerKrw(financial.ebitdaKrw, multiples.base)
    : null;
  const evHigh = positiveMultiple(multiples.high)
    ? evEbitdaIntegerKrw(financial.ebitdaKrw, multiples.high)
    : null;
  const enterpriseValue = evBase ?? evLow ?? evHigh;
  const equity = computeEquityValueRange({
    evStatus: "CALCULABLE",
    evLow,
    evBase,
    evHigh,
    financial,
  });

  return emptyResult(
    {
      status: "CALCULABLE",
      revenueKrw: financial.revenueKrw,
      ebitdaKrw: financial.ebitdaKrw,
      enterpriseValue,
      evLow,
      evBase,
      evHigh,
      equityValueRange: equity.equityValueRange,
      multipleUsed: multiples,
      assumptions: [
        "EV = Normalized EBITDA × EV/EBITDA Multiple",
        ...equity.assumptions,
        `Benchmark approvalStatus=${input.benchmark.approvalStatus}`,
      ],
      warnings: equity.warnings,
      sources: [input.benchmark.source],
    },
    calculatedAt,
  );
}

function evRangeCopy(result: ValuationCalculation): string {
  const low = result.evLow;
  const high = result.evHigh;
  const base = result.evBase ?? result.enterpriseValue;
  if (low != null && high != null) return formatKrwRange(low, high);
  if (base != null) return formatKrw(base);
  return formatKrwRange(low, high);
}

/** Seller UI. APPROVED EV/EBITDA가 아니면 금액을 넣지 않는다. */
export function formatSellerLevel1Copy(
  result: ValuationCalculation,
  benchmark: ValuationBenchmark | null,
): string {
  const approved =
    benchmark?.approvalStatus === "APPROVED" &&
    benchmark.method === "EV_EBITDA" &&
    result.status === "CALCULABLE";
  if (approved && result.enterpriseValue != null) {
    const range = evRangeCopy(result);
    const evCopy = `평가방식: ${EV_EBITDA_METHOD_LABEL}. 기업가치(Enterprise Value) 범위: ${range}. 기준: 승인된 비교배수.`;
    const equityShown =
      result.equityValueRange?.base ??
      result.equityValueRange?.low ??
      result.equityValueRange?.high ??
      null;
    if (equityShown != null) {
      const equityRange = formatKrwRange(
        result.equityValueRange?.low ?? equityShown,
        result.equityValueRange?.high ?? equityShown,
      );
      return `${evCopy} 확인된 순차입을 반영한 지분가치(Equity Value)는 ${equityRange}입니다. 매각가격이 아닙니다.`;
    }
    return `${evCopy} ${MISSING_NET_DEBT_EQUITY_COPY}`;
  }
  if (result.status === "MISSING_INPUT") {
    return MISSING_FINANCIAL_COPY;
  }
  if (
    result.status === "NOT_ELIGIBLE" &&
    result.warnings.includes("ebitda_not_positive")
  ) {
    return CALCULATION_ERROR_COPY;
  }
  return MISSING_EBITDA_BENCHMARK_COPY;
}
