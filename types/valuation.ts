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
  equityValueRange: null;
  multipleUsed: ValuationMultipleUsed | null;
  assumptions: string[];
  warnings: string[];
  sources: string[];
  calculatedAt: string;
};

export type ValuationResult = ValuationCalculation;
