/** LEVEL 0 EV/Sales. LLM이 Multiple·EV를 만들지 않는다. */

export type ValuationMethod = "EV_SALES";

export type BenchmarkApprovalStatus = "TEST_ONLY" | "UNVERIFIED" | "APPROVED";

export type BenchmarkSourceType =
  | "TEST_FIXTURE"
  | "INTERNAL_REVIEW"
  | "MARKET_PROVIDER"
  | "UNKNOWN";

export type ValuationConfidence = "LOW" | "MEDIUM" | "HIGH";

export type ValuationCalculationStatus =
  | "CALCULABLE"
  | "MISSING_INPUT"
  | "NOT_ELIGIBLE"
  | "MISSING_BENCHMARK";

export type ValuationCalculationMode = "production" | "unit_test";

/** 정규화 재무 입력. Seller 희망가·Buyer 투자규모는 포함하지 않는다. */
export type FinancialInput = {
  revenueKrw: number | null;
  revenueUnresolved: boolean;
  industry: string | null;
  /** 정규화된 순차입. Cash/Debt를 추정해 만들지 않는다. */
  netDebtKrw?: number | null;
  netDebtUnresolved?: boolean;
  /** 1 이상만 계산에 사용. 추정·placeholder·LLM 값은 신뢰하지 않는다. */
  netDebtConfidence?: number | null;
};

export type ValuationValueRange = {
  low: number | null;
  base: number | null;
  high: number | null;
};

export type ValuationBenchmark = {
  method: ValuationMethod;
  multiple: number | null;
  multipleLow: number | null;
  multipleBase: number | null;
  multipleHigh: number | null;
  source: string;
  sourceType: BenchmarkSourceType;
  asOfDate: string | null;
  industry: string | null;
  confidence: ValuationConfidence;
  approvalStatus: BenchmarkApprovalStatus;
};

export type ValuationMultipleUsed = {
  low: number | null;
  base: number | null;
  high: number | null;
};

export type ValuationCalculation = {
  method: ValuationMethod;
  status: ValuationCalculationStatus;
  revenueKrw: number | null;
  enterpriseValue: number | null;
  evLow: number | null;
  evBase: number | null;
  evHigh: number | null;
  /** EV − 확인된 Net Debt. 미확인·추정 순차입이면 null. 음수는 0으로 올리지 않는다. */
  equityValueRange: ValuationValueRange | null;
  multipleUsed: ValuationMultipleUsed | null;
  assumptions: string[];
  warnings: string[];
  sources: string[];
  calculatedAt: string;
};

export type ValuationResult = ValuationCalculation;
