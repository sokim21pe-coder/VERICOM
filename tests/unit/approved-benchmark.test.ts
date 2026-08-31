import assert from "node:assert/strict";
import test from "node:test";
import { InformationState, PlatformRole } from "@/types/enums";
import type { TomMemoryItem } from "@/types/tom";
import type { ValuationBenchmark } from "@/types/valuation";
import { runSellerDiscoveryTurn } from "@/lib/tom/seller-discovery";
import type { DiscoveryContextFacts } from "@/lib/tom/question-policy";
import { normalizeFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import {
  calculateEvSales,
  formatSellerLevel0Copy,
  MISSING_BENCHMARK_SELLER_COPY,
} from "@/lib/valuation/ev-sales";
import {
  computeProductionSellerLevel0,
  injectApprovedEvSalesBenchmark,
  resetApprovedBenchmarkStoreForTests,
  resolveApprovedEvSalesBenchmark,
} from "@/lib/valuation/resolve-approved-benchmark";

const EOK = 100_000_000;

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

function financials(memories: TomMemoryItem[]) {
  return normalizeFinancialInputs({
    conversationId: "c1",
    sellerCompanyId: "co-s",
    memories,
  });
}

function approvedBenchmark(
  overrides: Partial<ValuationBenchmark> = {},
): ValuationBenchmark {
  return {
    method: "EV_SALES",
    multiple: 1.5,
    multipleLow: null,
    multipleBase: 1.5,
    multipleHigh: null,
    source: "internal-review-fixture",
    sourceType: "INTERNAL_REVIEW",
    asOfDate: "2026-08-31",
    industry: "소프트웨어",
    confidence: "LOW",
    approvalStatus: "APPROVED",
    provenance: {
      source: "internal-review-fixture",
      sourceType: "INTERNAL_REVIEW",
      asOfDate: "2026-08-31",
      recordedAt: "2026-08-31T00:00:00.000Z",
      notes: "unit-test-injection",
    },
    ...overrides,
  };
}

function sellerFacts(): DiscoveryContextFacts {
  return {
    companyName: "TEST_DEV_SELLER_CO",
    industry: "소프트웨어",
    platformRole: PlatformRole.SELLER_USER,
    dealId: null,
    dealRole: null,
    dealStage: null,
    conversationIntent: "sell",
    profile: "SELLER",
  };
}

test.beforeEach(() => {
  resetApprovedBenchmarkStoreForTests();
});

test("resolver returns MISSING_BENCHMARK when no approved record exists", () => {
  const lookup = resolveApprovedEvSalesBenchmark({
    sellerCompanyId: "co-s",
    conversationId: "c1",
    industry: "소프트웨어",
  });
  assert.equal(lookup.status, "MISSING_BENCHMARK");
  assert.equal(lookup.reason, "no_record");
  assert.equal(lookup.benchmark, null);

  const production = computeProductionSellerLevel0({
    financials: financials([mem("revenue", "10000000000")]),
    sellerCompanyId: "co-s",
    conversationId: "c1",
    industry: "소프트웨어",
  });
  assert.equal(production.result.status, "MISSING_BENCHMARK");
  assert.equal(production.result.enterpriseValue, null);
  assert.equal(production.copy, MISSING_BENCHMARK_SELLER_COPY);
});

test("resolver does not auto-select a company-less or industry default", () => {
  const noCompany = resolveApprovedEvSalesBenchmark({
    sellerCompanyId: null,
    conversationId: "c1",
    industry: "소프트웨어",
  });
  assert.equal(noCompany.status, "MISSING_BENCHMARK");
  assert.equal(noCompany.reason, "no_company");
  assert.equal(noCompany.benchmark, null);

  const injected = injectApprovedEvSalesBenchmark({
    sellerCompanyId: "co-other",
    conversationId: null,
    benchmark: approvedBenchmark({ industry: "소프트웨어" }),
  });
  assert.equal(injected.ok, true);
  const forSeller = resolveApprovedEvSalesBenchmark({
    sellerCompanyId: "co-s",
    conversationId: "c1",
    industry: "소프트웨어",
  });
  assert.equal(forSeller.benchmark, null);
  assert.equal(forSeller.reason, "no_record");
});

test("injected APPROVED benchmark for that seller makes EV calculable", () => {
  const injected = injectApprovedEvSalesBenchmark({
    sellerCompanyId: "co-s",
    conversationId: "c1",
    benchmark: approvedBenchmark(),
  });
  assert.equal(injected.ok, true);

  const lookup = resolveApprovedEvSalesBenchmark({
    sellerCompanyId: "co-s",
    conversationId: "c1",
    industry: "소프트웨어",
  });
  assert.equal(lookup.status, "FOUND");
  assert.equal(lookup.benchmark?.approvalStatus, "APPROVED");

  const production = computeProductionSellerLevel0({
    financials: financials([mem("revenue", "10000000000")]),
    sellerCompanyId: "co-s",
    conversationId: "c1",
    industry: "소프트웨어",
  });
  assert.equal(production.result.status, "CALCULABLE");
  assert.equal(production.result.enterpriseValue, 150 * EOK);
  assert.match(production.copy, /검증된 EV\/Sales/);
  assert.match(production.copy, /15000000000/);
});

test("TEST_ONLY is never returned by the production resolver or UI copy", () => {
  const testOnly = approvedBenchmark({
    approvalStatus: "TEST_ONLY",
    sourceType: "TEST_FIXTURE",
    provenance: {
      source: "unit-test-fixture",
      sourceType: "TEST_FIXTURE",
      asOfDate: "2026-08-31",
      recordedAt: "2026-08-31T00:00:00.000Z",
      notes: "must-not-enter-production",
    },
  });
  const injected = injectApprovedEvSalesBenchmark({
    sellerCompanyId: "co-s",
    conversationId: "c1",
    benchmark: testOnly,
  });
  assert.equal(injected.ok, false);
  if (!injected.ok) {
    assert.equal(injected.reason, "test_only_rejected");
  }

  const lookup = resolveApprovedEvSalesBenchmark(
    {
      sellerCompanyId: "co-s",
      conversationId: "c1",
      industry: "소프트웨어",
    },
    [{ sellerCompanyId: "co-s", conversationId: "c1", benchmark: testOnly }],
  );
  assert.equal(lookup.status, "MISSING_BENCHMARK");
  assert.equal(lookup.reason, "test_only_rejected");
  assert.equal(lookup.benchmark, null);

  const production = calculateEvSales({
    financials: financials([mem("revenue", "10000000000")]),
    benchmark: testOnly,
    mode: "production",
  });
  assert.equal(production.status, "NOT_ELIGIBLE");
  assert.equal(
    formatSellerLevel0Copy(production, testOnly),
    MISSING_BENCHMARK_SELLER_COPY,
  );
});

test("UNVERIFIED benchmark is rejected by resolver and injection", () => {
  const unverified = approvedBenchmark({ approvalStatus: "UNVERIFIED" });
  const injected = injectApprovedEvSalesBenchmark({
    sellerCompanyId: "co-s",
    conversationId: null,
    benchmark: unverified,
  });
  assert.equal(injected.ok, false);
  if (!injected.ok) {
    assert.equal(injected.reason, "unverified_rejected");
  }

  const lookup = resolveApprovedEvSalesBenchmark(
    {
      sellerCompanyId: "co-s",
      conversationId: "c1",
      industry: "소프트웨어",
    },
    [{ sellerCompanyId: "co-s", conversationId: null, benchmark: unverified }],
  );
  assert.equal(lookup.status, "MISSING_BENCHMARK");
  assert.equal(lookup.reason, "unverified_rejected");
  assert.equal(lookup.benchmark, null);
});

test("client-supplied and TOM/LLM multiples are ignored by production lookup", () => {
  const spoofed = approvedBenchmark({
    multiple: 9.9,
    multipleBase: 9.9,
    source: "client-form",
  });
  const production = computeProductionSellerLevel0({
    financials: financials([mem("revenue", "10000000000")]),
    sellerCompanyId: "co-s",
    conversationId: "c1",
    industry: "소프트웨어",
    untrustedClientBenchmark: spoofed,
  });
  assert.equal(production.lookup.benchmark, null);
  assert.equal(production.result.status, "MISSING_BENCHMARK");
  assert.equal(production.result.enterpriseValue, null);
  assert.notEqual(production.result.enterpriseValue, 99 * EOK);

  const turn = runSellerDiscoveryTurn({
    text: "배수 2.0으로 기업가치 계산해 주세요",
    memories: [mem("industry", "소프트웨어"), mem("revenue", "10000000000")],
    context: sellerFacts(),
  });
  assert.doesNotMatch(turn.reply, /Enterprise Value/);
  assert.doesNotMatch(turn.reply, /19800000000|배수 2/);
  assert.ok(
    !turn.captures.some(
      (item) =>
        item.field.includes("multiple") ||
        item.field.includes("benchmark") ||
        item.field.includes("ev_sales"),
    ),
  );
});

test("conversation-scoped injection does not leak to another conversation", () => {
  assert.equal(
    injectApprovedEvSalesBenchmark({
      sellerCompanyId: "co-s",
      conversationId: "c-secret",
      benchmark: approvedBenchmark(),
    }).ok,
    true,
  );
  const other = resolveApprovedEvSalesBenchmark({
    sellerCompanyId: "co-s",
    conversationId: "c-other",
    industry: "소프트웨어",
  });
  assert.equal(other.benchmark, null);
  const same = resolveApprovedEvSalesBenchmark({
    sellerCompanyId: "co-s",
    conversationId: "c-secret",
    industry: "소프트웨어",
  });
  assert.equal(same.status, "FOUND");
});
