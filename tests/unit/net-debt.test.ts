import assert from "node:assert/strict";
import test from "node:test";
import { resolveNetDebtFromCashDebt, type NetDebtAmount } from "@/lib/valuation/net-debt";

const EOK = 100_000_000;

function amount(krw: number | null, unresolved = false): NetDebtAmount {
  return {
    krw,
    currency: "KRW",
    raw: krw == null ? "" : String(krw),
    unresolved,
    provenance:
      krw == null
        ? null
        : {
            sourceMemoryKey: "test",
            rawValue: String(krw),
            normalizedValue: `${krw}KRW`,
            normalizationRule: "test",
            confidence: 1,
          },
  };
}

function empty(): NetDebtAmount {
  return {
    krw: null,
    currency: "KRW",
    raw: "",
    unresolved: false,
    provenance: null,
  };
}

test("NETDEBT 1: Debt − Cash is integer KRW and does not invent a floor", () => {
  const resolved = resolveNetDebtFromCashDebt({
    cash: amount(10 * EOK),
    debt: amount(30 * EOK),
    statedNetDebt: empty(),
  });
  assert.equal(resolved.source, "debt_minus_cash");
  assert.equal(resolved.netDebt.krw, 20 * EOK);
  assert.equal(resolved.netDebt.unresolved, false);
  assert.equal(resolved.netDebt.provenance?.normalizationRule, "debt_minus_cash");
});

test("NETDEBT 2: cash only does not invent debt as zero", () => {
  const resolved = resolveNetDebtFromCashDebt({
    cash: amount(10 * EOK),
    debt: empty(),
    statedNetDebt: empty(),
  });
  assert.equal(resolved.source, "missing");
  assert.equal(resolved.netDebt.krw, null);
  assert.ok(resolved.warnings.includes("debt_missing_not_invented"));
});

test("NETDEBT 3: debt only does not invent cash as zero", () => {
  const resolved = resolveNetDebtFromCashDebt({
    cash: empty(),
    debt: amount(30 * EOK),
    statedNetDebt: empty(),
  });
  assert.equal(resolved.source, "missing");
  assert.equal(resolved.netDebt.krw, null);
  assert.ok(resolved.warnings.includes("cash_missing_not_invented"));
});

test("NETDEBT 4: incomplete cash/debt falls back to stated net_debt", () => {
  const resolved = resolveNetDebtFromCashDebt({
    cash: amount(10 * EOK),
    debt: empty(),
    statedNetDebt: amount(20 * EOK),
  });
  assert.equal(resolved.source, "stated_net_debt");
  assert.equal(resolved.netDebt.krw, 20 * EOK);
  assert.ok(resolved.warnings.includes("debt_missing_not_invented"));
});

test("NETDEBT 5: formula wins over conflicting stated net_debt", () => {
  const resolved = resolveNetDebtFromCashDebt({
    cash: amount(10 * EOK),
    debt: amount(50 * EOK),
    statedNetDebt: amount(100 * EOK),
  });
  assert.equal(resolved.source, "debt_minus_cash");
  assert.equal(resolved.netDebt.krw, 40 * EOK);
  assert.ok(resolved.warnings.includes("net_debt_conflict_used_formula"));
});

test("NETDEBT 6: unresolved cash is not treated as zero", () => {
  const unresolvedCash: NetDebtAmount = {
    krw: null,
    currency: "KRW",
    raw: "수십억",
    unresolved: true,
    provenance: {
      sourceMemoryKey: "cash",
      rawValue: "수십억",
      normalizedValue: "UNRESOLVED",
      normalizationRule: "vague_amount",
      confidence: 0,
    },
  };
  const resolved = resolveNetDebtFromCashDebt({
    cash: unresolvedCash,
    debt: amount(30 * EOK),
    statedNetDebt: empty(),
  });
  assert.equal(resolved.netDebt.krw, null);
  assert.ok(resolved.warnings.includes("cash_unresolved"));
});

test("NETDEBT 7: net cash (Debt < Cash) stays negative without a fabricated floor", () => {
  const resolved = resolveNetDebtFromCashDebt({
    cash: amount(50 * EOK),
    debt: amount(20 * EOK),
    statedNetDebt: empty(),
  });
  assert.equal(resolved.netDebt.krw, -30 * EOK);
});
