import type { NormalizedFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import { formatKrw, formatKrwRange } from "@/lib/valuation/format-krw";
import {
  CALCULATION_ERROR_COPY,
  EQUITY_NOT_CALCULATED_COPY,
  EV_SALES_METHOD_LABEL,
  MISSING_BENCHMARK_SELLER_COPY,
  MISSING_FINANCIAL_COPY,
} from "@/lib/valuation/seller-level0-presentation";
import type {
  FinancialInput,
  ValuationBenchmark,
  ValuationCalculation,
  ValuationCalculationMode,
  ValuationCalculationStatus,
  ValuationMultipleUsed,
  ValuationValueRange,
} from "@/types/valuation";

export {
  MISSING_BENCHMARK_SELLER_COPY,
  MISSING_FINANCIAL_COPY,
  CALCULATION_ERROR_COPY,
} from "@/lib/valuation/seller-level0-presentation";

export const MISSING_NET_DEBT_EQUITY_COPY = EQUITY_NOT_CALCULATED_COPY;

const MIN_NET_DEBT_CONFIDENCE = 1;

export function toFinancialInput(
  financials: NormalizedFinancialInputs,
): FinancialInput {
  const netDebtKnown =
    financials.netDebt.krw != null && !financials.netDebt.unresolved;
  return {
    revenueKrw: financials.revenue.krw,
    revenueUnresolved: financials.revenue.unresolved,
    industry: financials.industry,
    netDebtKrw: financials.netDebt.krw,
    netDebtUnresolved: financials.netDebt.unresolved,
    netDebtConfidence: netDebtKnown
      ? (financials.netDebt.provenance?.confidence ?? 1)
      : (financials.netDebt.provenance?.confidence ?? 0),
  };
}

export function isTrustworthyNetDebt(
  financial: FinancialInput,
): financial is FinancialInput & { netDebtKrw: number } {
  if (financial.netDebtUnresolved === true) return false;
  if (financial.netDebtKrw == null || !Number.isFinite(financial.netDebtKrw)) {
    return false;
  }
  if ((financial.netDebtConfidence ?? 0) < MIN_NET_DEBT_CONFIDENCE) {
    return false;
  }
  return true;
}

function integerKrw(value: number): number {
  return Math.round(value);
}

function equityFromEv(ev: number | null, netDebtKrw: number): number | null {
  if (ev == null) return null;
  return integerKrw(ev) - integerKrw(netDebtKrw);
}

/** EV가 CALCULABLE이고 정규화 순차입이 확인된 경우에만 Equity = EV − Net Debt. */
export function computeEquityValueRange(input: {
  evStatus: ValuationCalculationStatus;
  evLow: number | null;
  evBase: number | null;
  evHigh: number | null;
  financial: FinancialInput;
}): {
  equityValueRange: ValuationValueRange | null;
  warnings: string[];
  assumptions: string[];
} {
  if (input.evStatus !== "CALCULABLE") {
    return {
      equityValueRange: null,
      warnings: [],
      assumptions: ["Equity Value requires CALCULABLE Enterprise Value"],
    };
  }

  if (!isTrustworthyNetDebt(input.financial)) {
    return {
      equityValueRange: null,
      warnings: [
        input.financial.netDebtUnresolved
          ? "net_debt_unresolved"
          : "net_debt_missing",
      ],
      assumptions: [
        "Equity = Enterprise Value - Net Debt",
        "Equity Value is not calculated because net debt is not confirmed",
      ],
    };
  }

  const netDebt = integerKrw(input.financial.netDebtKrw);
  const low = equityFromEv(input.evLow, netDebt);
  const base = equityFromEv(input.evBase, netDebt);
  const high = equityFromEv(input.evHigh, netDebt);

  if (low == null && base == null && high == null) {
    return {
      equityValueRange: null,
      warnings: ["equity_ev_components_missing"],
      assumptions: ["Equity = Enterprise Value - Net Debt"],
    };
  }

  const warnings: string[] = [];
  if ([low, base, high].some((value) => value != null && value < 0)) {
    warnings.push("negative_equity");
  }

  return {
    equityValueRange: { low, base, high },
    warnings,
    assumptions: [
      "Equity = Enterprise Value - Net Debt",
      "Negative Equity is returned as computed integer KRW without a fabricated floor",
    ],
  };
}

export function evSalesIntegerKrw(revenueKrw: number, multiple: number): number {
  return Math.round(revenueKrw * multiple);
}

function emptyResult(
  partial: Omit<ValuationCalculation, "method" | "equityValueRange" | "calculatedAt"> & {
    calculatedAt?: string;
    equityValueRange?: ValuationValueRange | null;
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

function resolveFinancialInput(
  financials: NormalizedFinancialInputs | FinancialInput,
): FinancialInput {
  if ("revenue" in financials) {
    return toFinancialInput(financials);
  }
  return {
    revenueKrw: financials.revenueKrw,
    revenueUnresolved: financials.revenueUnresolved,
    industry: financials.industry,
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
  const financial = resolveFinancialInput(input.financials);

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
      enterpriseValue,
      evLow,
      evBase,
      evHigh,
      equityValueRange: equity.equityValueRange,
      multipleUsed: multiples,
      assumptions: [
        "EV = Normalized Revenue × EV/Sales Multiple",
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

/** Seller UI. APPROVED가 아니면 기업가치 금액을 넣지 않는다. TEST_ONLY 결과는 노출하지 않는다. */
export function formatSellerLevel0Copy(
  result: ValuationCalculation,
  benchmark: ValuationBenchmark | null,
): string {
  const approved =
    benchmark?.approvalStatus === "APPROVED" && result.status === "CALCULABLE";
  if (approved && result.enterpriseValue != null) {
    const range = evRangeCopy(result);
    const evCopy = `평가방식: ${EV_SALES_METHOD_LABEL}. 기업가치(Enterprise Value) 범위: ${range}. 기준: 승인된 비교배수.`;
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
    result.warnings.includes("revenue_not_positive")
  ) {
    return CALCULATION_ERROR_COPY;
  }
  return MISSING_BENCHMARK_SELLER_COPY;
}
