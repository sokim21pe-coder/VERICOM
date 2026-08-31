import assert from "node:assert/strict";
import test from "node:test";
import {
  InformationState,
  MembershipRole,
  MembershipStatus,
  PlatformRole,
} from "@/types/enums";
import {
  canReadNormalizedBuyerCriteria,
  canReadNormalizedSellerFinancials,
} from "@/lib/tom/access";
import type { TomConversation, TomMemoryItem } from "@/types/tom";
import { normalizeAcquisitionCriteria } from "@/lib/tom/normalize-acquisition-criteria";
import { normalizeFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import { encodeNumericCriterion } from "@/lib/tom/criteria-value";
import {
  buyerNextAction,
  matchingVisibility,
  platformRoleLabel,
  sellerNextAction,
  valuationVisibility,
  visibleDiscoveryFields,
  SELLER_HOME_FIELDS,
  discoveryFactsFromContext,
  displayMemoryValue,
} from "@/lib/workspace/visibility";
import type { CurrentContext } from "@/types/context";

function memory(key: string, value: string): TomMemoryItem {
  return {
    key,
    value,
    informationState: InformationState.CONFIRMED,
    source: "user:USER_CLAIM",
    confidence: 1,
  };
}

function sellerContext(): CurrentContext {
  return {
    user: {
      id: "u1",
      authUserId: "a1",
      email: "seller@vericom.test",
      displayName: "Seller",
    },
    company: {
      id: "co-s",
      name: "TEST_DEV_SELLER_CO",
      industry: "제조",
      verificationStatus: "unverified",
    },
    platformRole: PlatformRole.SELLER_USER,
    platformRoles: [PlatformRole.SELLER_USER],
    companyMembership: {
      id: "m1",
      companyId: "co-s",
      role: MembershipRole.OWNER,
      status: MembershipStatus.ACTIVE,
    },
    deal: null,
    dealRole: null,
    permissions: [],
  };
}

test("discovery fields show 입력 vs 미입력 without inventing values", () => {
  const memories = [memory("reason_for_sale", "승계")];
  const fields = visibleDiscoveryFields({
    memories,
    context: discoveryFactsFromContext(sellerContext(), "sell"),
    fields: SELLER_HOME_FIELDS,
    profile: "SELLER",
  });
  const reason = fields.find((item) => item.id === "reason_for_sale");
  const scope = fields.find((item) => item.id === "sale_scope");
  assert.equal(reason?.presence, "입력");
  assert.equal(reason?.value, "승계");
  assert.equal(scope?.presence, "미입력");
  assert.equal(scope?.value, null);
});

test("valuation never shows unverified EV", () => {
  const financials = normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories: [memory("revenue", encodeNumericCriterion({ krw: 10_000_000_000, raw: "100억" }))],
  });
  const missing = valuationVisibility({
    hasConversation: true,
    financials,
    status: "MISSING_BENCHMARK",
    copy: null,
  });
  assert.equal(missing.statusLabel, "Benchmark 필요");
  assert.equal(missing.showEnterpriseValue, false);
  assert.doesNotMatch(missing.copy, /\d+원/);

  const empty = valuationVisibility({
    hasConversation: false,
    financials: null,
    status: null,
    copy: "검증된 EV/Sales 배수로 계산한 기업가치(Enterprise Value)는 999원입니다.",
  });
  assert.equal(empty.statusLabel, "데이터 없음");
  assert.equal(empty.showEnterpriseValue, false);
  assert.doesNotMatch(empty.copy, /999/);
});

test("matching never invents recommended companies", () => {
  const empty = matchingVisibility(null);
  assert.deepEqual(empty.recommendedCompanies, []);
  assert.equal(empty.statusLabel, "미입력");

  const criteria = normalizeAcquisitionCriteria({
    conversationId: "c1",
    buyerCompanyId: "co-b",
    memories: [
      memory("acquisition_objective", "사업확장"),
      memory("target_industries", "이차전지"),
      memory("target_businesses", "BMS"),
      memory("target_geographies", "한국"),
      memory("investment_size_max", encodeNumericCriterion({ krw: 50_000_000_000, raw: "500억" })),
    ],
  });
  const ready = matchingVisibility(criteria);
  assert.deepEqual(ready.recommendedCompanies, []);
  assert.ok(
    ready.statusLabel === "인수조건 정리 완료" ||
      ready.statusLabel === "Matching Engine 준비 전",
  );
  assert.match(ready.copy, /추천 회사는/);
});

test("seller next action follows real state", () => {
  const start = sellerNextAction({
    hasConversation: false,
    userMessageCount: 0,
    nextQuestion: null,
    requiredKnown: 0,
    requiredTotal: 4,
    valuation: {
      statusLabel: "데이터 없음",
      copy: "",
      showEnterpriseValue: false,
    },
  });
  assert.equal(start.href, "/consult?intent=sell");
  assert.match(start.label, /TOM/);

  const benchmark = sellerNextAction({
    hasConversation: true,
    userMessageCount: 3,
    nextQuestion: null,
    requiredKnown: 4,
    requiredTotal: 4,
    valuation: {
      statusLabel: "Benchmark 필요",
      copy: "",
      showEnterpriseValue: false,
    },
  });
  assert.equal(benchmark.href, "/seller/valuation");
});

test("buyer next action does not point to fake matches", () => {
  const action = buyerNextAction({
    hasConversation: true,
    userMessageCount: 4,
    nextQuestion: null,
    requiredKnown: 4,
    requiredTotal: 4,
    matching: {
      statusLabel: "인수조건 정리 완료",
      copy: "",
      recommendedCompanies: [],
    },
  });
  assert.equal(action.href, "/buyer/criteria");
  assert.doesNotMatch(action.href, /recommended/);
});

test("displayMemoryValue hides developer JSON", () => {
  assert.equal(displayMemoryValue('{"krw":10000000000,"raw":"100억"}'), "100억");
  assert.equal(displayMemoryValue("UNKNOWN"), null);
});

test("platform role labels stay Korean", () => {
  assert.equal(platformRoleLabel(PlatformRole.SELLER_USER), "매각 담당");
  assert.equal(platformRoleLabel(PlatformRole.BUYER_USER), "인수 담당");
});

test("seller cannot read buyer criteria of another company", () => {
  const conversation: TomConversation = {
    id: "c-buy",
    intent: "buy",
    companyId: "co-b",
    dealId: null,
  };
  assert.equal(
    canReadNormalizedBuyerCriteria(conversation, sellerContext()),
    false,
  );
  assert.equal(
    canReadNormalizedSellerFinancials(
      { id: "c-sell", intent: "sell", companyId: "co-other", dealId: null },
      sellerContext(),
    ),
    false,
  );
});
