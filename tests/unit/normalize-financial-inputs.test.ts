import assert from "node:assert/strict";
import test from "node:test";
import { InformationState, PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";
import type { TomConversation, TomMemoryItem } from "@/types/tom";
import { encodeNumericCriterion } from "@/lib/tom/criteria-value";
import { canReadNormalizedSellerFinancials } from "@/lib/tom/access";
import {
  formatNormalizedFinancialSummary,
  normalizeFinancialInputs,
} from "@/lib/valuation/normalize-financial-inputs";

function mem(
  key: string,
  value: string,
  state: InformationState = InformationState.CONFIRMED,
): TomMemoryItem {
  return {
    key,
    value,
    informationState: state,
    source: "user_message:USER_CLAIM",
    confidence: 1,
  };
}

function viewer(companyId: string, role: PlatformRole): CurrentContext {
  return {
    user: {
      id: `u-${companyId}`,
      authUserId: `a-${companyId}`,
      email: `${companyId}@test`,
      displayName: companyId,
    },
    company: {
      id: companyId,
      name: companyId,
      industry: null,
      verificationStatus: "unverified",
    },
    platformRole: role,
    platformRoles: [role],
    companyMembership: null,
    deal: null,
    dealRole: null,
    permissions: [],
  };
}

test("100억 revenue normalizes to 10000000000 KRW", () => {
  const snapshot = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [mem("revenue", "10000000000"), mem("industry", "소프트웨어")],
  });
  assert.equal(snapshot.revenue.krw, 10_000_000_000);
  assert.equal(snapshot.revenue.currency, "KRW");
  assert.equal(snapshot.industry, "소프트웨어");
  assert.equal(snapshot.completeness.missingForLevel0.length, 0);
});

test("eok text revenue is normalized", () => {
  const snapshot = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [mem("revenue", encodeNumericCriterion({ krw: 5_000_000_000, raw: "50억" }))],
  });
  assert.equal(snapshot.revenue.krw, 5_000_000_000);
  assert.match(snapshot.revenue.raw, /50억/);
});

test("vague tens-of-billions stays unresolved", () => {
  const snapshot = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [mem("revenue", encodeNumericCriterion({ krw: null, raw: "수십억" }))],
  });
  assert.equal(snapshot.revenue.krw, null);
  assert.equal(snapshot.revenue.unresolved, true);
  assert.ok(snapshot.normalizationWarnings.some((item) => item.includes("vague_amount")));
});

test("ebitda and revenue stay separate", () => {
  const snapshot = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [
      mem("revenue", "30000000000"),
      mem("ebitda", "2000000000"),
    ],
  });
  assert.equal(snapshot.revenue.krw, 30_000_000_000);
  assert.equal(snapshot.ebitda.krw, 2_000_000_000);
});

test("does not invent cash or debt from net_debt", () => {
  const snapshot = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [mem("net_debt", "1000000000")],
  });
  assert.equal(snapshot.netDebt.krw, 1_000_000_000);
  assert.equal(snapshot.cash.krw, null);
  assert.equal(snapshot.debt.krw, null);
});

test("cash and debt compute net debt without inventing a missing side", () => {
  const computed = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [mem("cash", "1000000000"), mem("debt", "3000000000")],
  });
  assert.equal(computed.cash.krw, 1_000_000_000);
  assert.equal(computed.debt.krw, 3_000_000_000);
  assert.equal(computed.netDebt.krw, 2_000_000_000);
  assert.equal(computed.netDebt.provenance?.normalizationRule, "debt_minus_cash");

  const cashOnly = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [mem("cash", "1000000000")],
  });
  assert.equal(cashOnly.netDebt.krw, null);
  assert.equal(cashOnly.debt.krw, null);
  assert.ok(cashOnly.normalizationWarnings.includes("debt_missing_not_invented"));
});

test("buyer criteria are not mixed into seller financials", () => {
  const snapshot = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [
      mem("revenue", "10000000000"),
      mem("target_revenue_min", encodeNumericCriterion({ krw: 30_000_000_000, raw: "300억" })),
      mem("investment_size_max", encodeNumericCriterion({ krw: 10_000_000_000, raw: "100억" })),
    ],
  });
  assert.equal(snapshot.revenue.krw, 10_000_000_000);
  assert.equal(snapshot.sourceMemoryKeys.includes("target_revenue_min"), false);
  assert.ok(snapshot.normalizationWarnings.some((item) => item.startsWith("ignored_buyer_criteria")));
});

test("seller expectation is not treated as revenue", () => {
  const snapshot = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [
      mem("valuation_expectation", "20000000000"),
      mem("revenue", "10000000000"),
    ],
  });
  assert.equal(snapshot.revenue.krw, 10_000_000_000);
  assert.equal(snapshot.sellerExpectationRaw, "20000000000");
  assert.equal(snapshot.sourceMemoryKeys.includes("valuation_expectation"), false);
});

test("same input same output", () => {
  const memories = [mem("revenue", "10000000000"), mem("industry", "소프트웨어")];
  const a = normalizeFinancialInputs({ conversationId: "c1", sellerCompanyId: "co-s", memories });
  const b = normalizeFinancialInputs({ conversationId: "c1", sellerCompanyId: "co-s", memories });
  assert.deepEqual(a, b);
});

test("deterministic summary does not invent EV", () => {
  const snapshot = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [mem("industry", "소프트웨어"), mem("revenue", "10000000000")],
  });
  const summary = formatNormalizedFinancialSummary(snapshot);
  assert.match(summary, /소프트웨어/);
  assert.match(summary, /100억원/);
  assert.match(summary, /기업가치 숫자는 아직 계산하지 않습니다/);
  assert.doesNotMatch(summary, /Enterprise|지분가치|Equity/);
});

test("Buyer cannot read seller financials", () => {
  const conversation: TomConversation = {
    id: "conv-s",
    intent: "sell",
    companyId: "co-s",
    dealId: null,
  };
  assert.equal(
    canReadNormalizedSellerFinancials(conversation, viewer("co-s", PlatformRole.BUYER_USER)),
    false,
  );
  assert.equal(
    canReadNormalizedSellerFinancials(conversation, viewer("co-s", PlatformRole.SELLER_USER)),
    true,
  );
  assert.equal(
    canReadNormalizedSellerFinancials(conversation, viewer("co-b", PlatformRole.SELLER_USER)),
    false,
  );
});

test("provenance tracks revenue memory key", () => {
  const snapshot = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [mem("revenue", "10000000000")],
  });
  assert.equal(snapshot.revenue.provenance?.sourceMemoryKey, "revenue");
  assert.equal(snapshot.revenue.provenance?.normalizedValue, "10000000000KRW");
});
