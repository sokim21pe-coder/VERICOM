/** 순환 import를 피하기 위한 금액 형태. NormalizedFinancialAmount와 동일하다. */
export type NetDebtAmount = {
  krw: number | null;
  currency: "KRW";
  raw: string;
  unresolved: boolean;
  provenance: {
    sourceMemoryKey: string;
    rawValue: string;
    normalizedValue: string;
    normalizationRule: string;
    confidence: number;
  } | null;
};

export type NetDebtSource = "debt_minus_cash" | "stated_net_debt" | "missing";

export type NetDebtResolution = {
  netDebt: NetDebtAmount;
  warnings: string[];
  source: NetDebtSource;
};

function integerKrw(value: number): number {
  return Math.round(value);
}

function isResolvedKrw(
  amount: NetDebtAmount,
): amount is NetDebtAmount & { krw: number } {
  return amount.krw != null && !amount.unresolved && Number.isFinite(amount.krw);
}

/**
 * MASTER_SPEC 9.3: Net Debt = Debt − Cash.
 * 한쪽만 있으면 다른 쪽을 0으로 두지 않는다. LLM·업종 기본값으로 만들지 않는다.
 */
export function resolveNetDebtFromCashDebt(input: {
  cash: NetDebtAmount;
  debt: NetDebtAmount;
  statedNetDebt: NetDebtAmount;
}): NetDebtResolution {
  const warnings: string[] = [];
  const cashResolved = isResolvedKrw(input.cash);
  const debtResolved = isResolvedKrw(input.debt);
  const statedResolved = isResolvedKrw(input.statedNetDebt);

  if (input.cash.unresolved) warnings.push("cash_unresolved");
  if (input.debt.unresolved) warnings.push("debt_unresolved");
  if (cashResolved && !debtResolved && !input.debt.unresolved) {
    warnings.push("debt_missing_not_invented");
  }
  if (debtResolved && !cashResolved && !input.cash.unresolved) {
    warnings.push("cash_missing_not_invented");
  }

  if (cashResolved && debtResolved) {
    const cashKrw = input.cash.krw;
    const debtKrw = input.debt.krw;
    const statedKrw = input.statedNetDebt.krw;
    if (cashKrw == null || debtKrw == null) {
      return {
        netDebt: input.statedNetDebt,
        warnings,
        source: statedResolved ? "stated_net_debt" : "missing",
      };
    }
    const krw = integerKrw(debtKrw) - integerKrw(cashKrw);
    if (statedResolved && statedKrw != null && integerKrw(statedKrw) !== krw) {
      warnings.push("net_debt_conflict_used_formula");
    }
    return {
      netDebt: {
        krw,
        currency: "KRW",
        raw: "debt-cash",
        unresolved: false,
        provenance: {
          sourceMemoryKey: "cash+debt",
          rawValue: `${input.debt.raw}|${input.cash.raw}`,
          normalizedValue: `${krw}KRW`,
          normalizationRule: "debt_minus_cash",
          confidence: 1,
        },
      },
      warnings,
      source: "debt_minus_cash",
    };
  }

  return {
    netDebt: input.statedNetDebt,
    warnings,
    source: statedResolved ? "stated_net_debt" : "missing",
  };
}
