import type { TomMemoryItem } from "@/types/tom";
import { parseKrwExpression, parseNumericCriterion } from "@/lib/tom/criteria-value";
import {
  BUYER_CRITERIA_EXCLUDED_FROM_FINANCIALS,
  SELLER_EXPECTATION_KEY,
  SELLER_FINANCIAL_KEYS,
} from "@/lib/valuation/financial-memory-keys";
import { resolveNetDebtFromCashDebt } from "@/lib/valuation/net-debt";

export type FinancialProvenance = {
  sourceMemoryKey: string;
  rawValue: string;
  normalizedValue: string;
  normalizationRule: string;
  confidence: number;
};

export type NormalizedFinancialAmount = {
  krw: number | null;
  currency: "KRW";
  raw: string;
  unresolved: boolean;
  provenance: FinancialProvenance | null;
};

export type NormalizedFinancialInputs = {
  sellerCompanyId: string | null;
  conversationId: string;
  companyName: string | null;
  industry: string | null;
  revenue: NormalizedFinancialAmount;
  revenueYear1: NormalizedFinancialAmount;
  revenueYear2: NormalizedFinancialAmount;
  revenueYear3: NormalizedFinancialAmount;
  ebitda: NormalizedFinancialAmount;
  ebitdaYear1: NormalizedFinancialAmount;
  ebitdaYear2: NormalizedFinancialAmount;
  ebitdaYear3: NormalizedFinancialAmount;
  operatingProfit: NormalizedFinancialAmount;
  cash: NormalizedFinancialAmount;
  debt: NormalizedFinancialAmount;
  netDebt: NormalizedFinancialAmount;
  sellerExpectationRaw: string | null;
  sourceMemoryKeys: string[];
  normalizationWarnings: string[];
  completeness: {
    knownInputs: number;
    inputTotal: number;
    missingForLevel0: string[];
    missingForLevel1: string[];
    missingYearInputs: string[];
  };
};

const FINANCIAL_KEY_SET = new Set<string>(SELLER_FINANCIAL_KEYS);
const BUYER_KEY_SET = new Set<string>(BUYER_CRITERIA_EXCLUDED_FROM_FINANCIALS);

export type NormalizeFinancialInputsInput = {
  memories: TomMemoryItem[];
  conversationId: string;
  sellerCompanyId: string | null;
};

function emptyAmount(): NormalizedFinancialAmount {
  return {
    krw: null,
    currency: "KRW",
    raw: "",
    unresolved: false,
    provenance: null,
  };
}

function knownValue(item: TomMemoryItem | undefined): boolean {
  if (!item?.value?.trim()) return false;
  const value = item.value.trim();
  if (value === "UNKNOWN" || value === "SKIPPED") return false;
  if (item.informationState === "UNKNOWN") return false;
  return true;
}

function amountFromMemory(
  item: TomMemoryItem | undefined,
  warnings: string[],
): NormalizedFinancialAmount {
  if (!item?.value || !knownValue(item)) return emptyAmount();
  const stored = parseNumericCriterion(item.value);
  const parsed = parseKrwExpression(item.value);
  if (stored?.krw != null && parsed.valueKrw == null && parsed.minKrw == null && parsed.maxKrw == null) {
    parsed.valueKrw = stored.krw;
    parsed.unresolved = false;
    parsed.warning = null;
    parsed.raw = stored.raw;
  }
  const krw = parsed.valueKrw ?? parsed.minKrw ?? parsed.maxKrw ?? stored?.krw ?? null;
  if (parsed.unresolved || krw == null) {
    warnings.push(`${item.key}:${parsed.warning ?? "unresolved_amount"}`);
    return {
      krw: null,
      currency: "KRW",
      raw: parsed.raw || item.value,
      unresolved: true,
      provenance: {
        sourceMemoryKey: item.key,
        rawValue: parsed.raw || item.value,
        normalizedValue: "UNRESOLVED",
        normalizationRule: parsed.warning ?? "unresolved_amount",
        confidence: 0,
      },
    };
  }
  return {
    krw,
    currency: "KRW",
    raw: parsed.raw || item.value,
    unresolved: false,
    provenance: {
      sourceMemoryKey: item.key,
      rawValue: parsed.raw || item.value,
      normalizedValue: `${krw}KRW`,
      normalizationRule: "krw_eok_or_stored",
      confidence: 1,
    },
  };
}

export function normalizeFinancialInputs(
  input: NormalizeFinancialInputsInput,
): NormalizedFinancialInputs {
  const warnings: string[] = [];
  const byKey = new Map<string, TomMemoryItem>();
  for (const item of input.memories) {
    if (FINANCIAL_KEY_SET.has(item.key) || item.key === SELLER_EXPECTATION_KEY) {
      byKey.set(item.key, item);
    }
    if (BUYER_KEY_SET.has(item.key)) {
      warnings.push(`ignored_buyer_criteria:${item.key}`);
    }
  }

  const statedRevenue = amountFromMemory(byKey.get("revenue"), warnings);
  const revenueYear1Stored = amountFromMemory(byKey.get("revenue_year_1"), warnings);
  const revenueYear2 = amountFromMemory(byKey.get("revenue_year_2"), warnings);
  const revenueYear3 = amountFromMemory(byKey.get("revenue_year_3"), warnings);
  const statedEbitda = amountFromMemory(byKey.get("ebitda"), warnings);
  const ebitdaYear1Stored = amountFromMemory(byKey.get("ebitda_year_1"), warnings);
  const ebitdaYear2 = amountFromMemory(byKey.get("ebitda_year_2"), warnings);
  const ebitdaYear3 = amountFromMemory(byKey.get("ebitda_year_3"), warnings);
  const revenue =
    statedRevenue.krw != null || statedRevenue.unresolved
      ? statedRevenue
      : revenueYear1Stored;
  const ebitda =
    statedEbitda.krw != null || statedEbitda.unresolved
      ? statedEbitda
      : ebitdaYear1Stored;
  const revenueYear1 =
    revenueYear1Stored.krw != null || revenueYear1Stored.unresolved
      ? revenueYear1Stored
      : revenue;
  const ebitdaYear1 =
    ebitdaYear1Stored.krw != null || ebitdaYear1Stored.unresolved
      ? ebitdaYear1Stored
      : ebitda;
  const operatingProfit = amountFromMemory(byKey.get("operating_profit"), warnings);
  const cash = amountFromMemory(byKey.get("cash"), warnings);
  const debt = amountFromMemory(byKey.get("debt"), warnings);
  const statedNetDebt = amountFromMemory(byKey.get("net_debt"), warnings);
  const netDebtResolved = resolveNetDebtFromCashDebt({
    cash,
    debt,
    statedNetDebt,
  });
  warnings.push(...netDebtResolved.warnings);
  const netDebt = netDebtResolved.netDebt;

  const industryItem = byKey.get("industry");
  const nameItem = byKey.get("company_name");
  const expectation = byKey.get(SELLER_EXPECTATION_KEY);

  const sourceMemoryKeys = [...byKey.keys()]
    .filter((key) => key !== SELLER_EXPECTATION_KEY)
    .sort();

  const missingForLevel0: string[] = [];
  if (!knownValue(industryItem)) missingForLevel0.push("industry");
  if (revenue.krw == null) missingForLevel0.push("revenue");

  const missingForLevel1: string[] = [];
  if (ebitda.krw == null || ebitda.unresolved) missingForLevel1.push("정규화 EBITDA");

  const missingYearInputs: string[] = [];
  if (revenueYear1.krw == null && !revenueYear1.unresolved) {
    missingYearInputs.push("매출 1년차(최근)");
  }
  if (revenueYear2.krw == null && !revenueYear2.unresolved) {
    missingYearInputs.push("매출 2년차");
  }
  if (revenueYear3.krw == null && !revenueYear3.unresolved) {
    missingYearInputs.push("매출 3년차");
  }
  if (ebitdaYear1.krw == null && !ebitdaYear1.unresolved) {
    missingYearInputs.push("EBITDA 1년차(최근)");
  }
  if (ebitdaYear2.krw == null && !ebitdaYear2.unresolved) {
    missingYearInputs.push("EBITDA 2년차");
  }
  if (ebitdaYear3.krw == null && !ebitdaYear3.unresolved) {
    missingYearInputs.push("EBITDA 3년차");
  }

  const knownInputs = [
    revenue.krw != null,
    revenueYear2.krw != null,
    revenueYear3.krw != null,
    ebitda.krw != null,
    ebitdaYear2.krw != null,
    ebitdaYear3.krw != null,
    operatingProfit.krw != null,
    cash.krw != null,
    debt.krw != null,
    netDebt.krw != null,
    knownValue(industryItem),
  ].filter(Boolean).length;

  return {
    sellerCompanyId: input.sellerCompanyId,
    conversationId: input.conversationId,
    companyName: nameItem && knownValue(nameItem) ? nameItem.value : null,
    industry: industryItem && knownValue(industryItem) ? industryItem.value : null,
    revenue,
    revenueYear1,
    revenueYear2,
    revenueYear3,
    ebitda,
    ebitdaYear1,
    ebitdaYear2,
    ebitdaYear3,
    operatingProfit,
    cash,
    debt,
    netDebt,
    sellerExpectationRaw:
      expectation && knownValue(expectation) ? expectation.value : null,
    sourceMemoryKeys,
    normalizationWarnings: warnings,
    completeness: {
      knownInputs,
      inputTotal: 11,
      missingForLevel0,
      missingForLevel1,
      missingYearInputs,
    },
  };
}

export function formatKrwEokLabel(krw: number): string {
  const eok = krw / 100_000_000;
  return `${Number.isInteger(eok) ? String(eok) : String(eok)}억원`;
}

export function formatNormalizedFinancialSummary(
  inputs: NormalizedFinancialInputs,
): string {
  const parts: string[] = [];
  if (inputs.industry) parts.push(`업종 ${inputs.industry}`);
  if (inputs.revenue.krw != null) parts.push(`매출 ${formatKrwEokLabel(inputs.revenue.krw)}`);
  if (inputs.ebitda.krw != null) parts.push(`EBITDA ${formatKrwEokLabel(inputs.ebitda.krw)}`);
  if (inputs.cash.krw != null) parts.push(`현금 ${formatKrwEokLabel(inputs.cash.krw)}`);
  if (inputs.debt.krw != null) parts.push(`차입 ${formatKrwEokLabel(inputs.debt.krw)}`);
  if (inputs.netDebt.krw != null) parts.push(`순차입 ${formatKrwEokLabel(inputs.netDebt.krw)}`);
  if (!parts.length) {
    return "아직 정규화된 재무 입력이 충분하지 않습니다.";
  }
  return `현재 저장된 재무 입력은 ${parts.join(", ")}입니다. 기업가치 숫자는 아직 계산하지 않습니다.`;
}
