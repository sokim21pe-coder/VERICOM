import type { TomMemoryItem } from "@/types/tom";
import { parseKrwExpression, parseNumericCriterion } from "@/lib/tom/criteria-value";
import {
  BUYER_CRITERIA_EXCLUDED_FROM_FINANCIALS,
  SELLER_EXPECTATION_KEY,
  SELLER_FINANCIAL_KEYS,
} from "@/lib/valuation/financial-memory-keys";

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
  ebitda: NormalizedFinancialAmount;
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

  const revenue = amountFromMemory(byKey.get("revenue"), warnings);
  const ebitda = amountFromMemory(byKey.get("ebitda"), warnings);
  const operatingProfit = amountFromMemory(byKey.get("operating_profit"), warnings);
  const netDebt = amountFromMemory(byKey.get("net_debt"), warnings);

  const industryItem = byKey.get("industry");
  const nameItem = byKey.get("company_name");
  const expectation = byKey.get(SELLER_EXPECTATION_KEY);

  const sourceMemoryKeys = [...byKey.keys()]
    .filter((key) => key !== SELLER_EXPECTATION_KEY)
    .sort();

  const missingForLevel0: string[] = [];
  if (!knownValue(industryItem)) missingForLevel0.push("industry");
  if (revenue.krw == null) missingForLevel0.push("revenue");

  const knownInputs = [
    revenue.krw != null,
    ebitda.krw != null,
    operatingProfit.krw != null,
    netDebt.krw != null,
    knownValue(industryItem),
  ].filter(Boolean).length;

  return {
    sellerCompanyId: input.sellerCompanyId,
    conversationId: input.conversationId,
    companyName: nameItem && knownValue(nameItem) ? nameItem.value : null,
    industry: industryItem && knownValue(industryItem) ? industryItem.value : null,
    revenue,
    ebitda,
    operatingProfit,
    cash: emptyAmount(),
    debt: emptyAmount(),
    netDebt,
    sellerExpectationRaw:
      expectation && knownValue(expectation) ? expectation.value : null,
    sourceMemoryKeys,
    normalizationWarnings: warnings,
    completeness: {
      knownInputs,
      inputTotal: 5,
      missingForLevel0,
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
  if (inputs.netDebt.krw != null) parts.push(`순차입 ${formatKrwEokLabel(inputs.netDebt.krw)}`);
  if (!parts.length) {
    return "아직 정규화된 재무 입력이 충분하지 않습니다.";
  }
  return `현재 저장된 재무 입력은 ${parts.join(", ")}입니다. 기업가치 숫자는 아직 계산하지 않습니다.`;
}
