/** Seller 재무 입력 Memory 키. Buyer Acquisition Criteria와 섞지 않는다. */

export const SELLER_FINANCIAL_KEYS = [
  "company_name",
  "industry",
  "revenue",
  "revenue_year_1",
  "revenue_year_2",
  "revenue_year_3",
  "ebitda",
  "ebitda_year_1",
  "ebitda_year_2",
  "ebitda_year_3",
  "operating_profit",
  "cash",
  "debt",
  "net_debt",
] as const;

export const BUYER_CRITERIA_EXCLUDED_FROM_FINANCIALS = [
  "target_revenue_min",
  "target_revenue_max",
  "target_ebitda_min",
  "target_ebitda_max",
  "investment_size_min",
  "investment_size_max",
  "acquisition_objective",
] as const;

export const SELLER_EXPECTATION_KEY = "valuation_expectation";
