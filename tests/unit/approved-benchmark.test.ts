import assert from "node:assert/strict";
import test from "node:test";
import { InformationState, PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";
import type { TomMemoryItem } from "@/types/tom";
import type { ApprovedBenchmarkRow, ValuationBenchmark } from "@/types/valuation";
import {
  canReadApprovedValuationBenchmark,
  canWriteApprovedBenchmarkForAssignedSeller,
  canWriteApprovedValuationBenchmark,
} from "@/lib/tom/access";
import { runSellerDiscoveryTurn } from "@/lib/tom/seller-discovery";
import type { DiscoveryContextFacts } from "@/lib/tom/question-policy";
import { normalizeFinancialInputs } from "@/lib/valuation/normalize-financial-inputs";
import {
  calculateEvSales,
  formatSellerLevel0Copy,
  MISSING_BENCHMARK_SELLER_COPY,
} from "@/lib/valuation/ev-sales";
import {
  buildApprovedBenchmarkInsert,
  filterBenchmarkRowsForCompany,
  mapApprovedBenchmarkRow,
  persistApprovedEvSalesBenchmark,
} from "@/lib/valuation/approved-benchmark-persistence";
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

function dbRow(
  overrides: Partial<ApprovedBenchmarkRow> = {},
): ApprovedBenchmarkRow {
  return {
    company_id: "co-a",
    conversation_id: null,
    deal_id: null,
    method: "EV_SALES",
    multiple: "1.5",
    multiple_low: null,
    multiple_base: "1.5",
    multiple_high: null,
    source: "internal-review-fixture",
    source_type: "INTERNAL_REVIEW",
    as_of_date: "2026-08-31",
    industry: "소프트웨어",
    confidence: "LOW",
    approval_status: "APPROVED",
    provenance: {
      source: "internal-review-fixture",
      sourceType: "INTERNAL_REVIEW",
      asOfDate: "2026-08-31",
      recordedAt: "2026-08-31T00:00:00.000Z",
      notes: "fixture",
    },
    created_by: "u-staff",
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
  assert.match(production.copy, /EV \/ Sales/);
  assert.match(production.copy, /150억/);
  assert.match(production.copy, /승인된 비교배수/);
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

test("production path with empty DB records stays MISSING_BENCHMARK and has no EV", () => {
  assert.equal(
    injectApprovedEvSalesBenchmark({
      sellerCompanyId: "co-a",
      conversationId: null,
      benchmark: approvedBenchmark(),
    }).ok,
    true,
  );
  const production = computeProductionSellerLevel0({
    financials: financials([mem("revenue", "10000000000")]),
    sellerCompanyId: "co-a",
    conversationId: "c1",
    industry: "소프트웨어",
    records: [],
  });
  assert.equal(production.lookup.status, "MISSING_BENCHMARK");
  assert.equal(production.result.status, "MISSING_BENCHMARK");
  assert.equal(production.result.enterpriseValue, null);
});

test("APPROVED DB row for company A makes EV calculable for A only", () => {
  const mappedA = mapApprovedBenchmarkRow(dbRow({ company_id: "co-a" }));
  assert.ok(mappedA);
  const forA = computeProductionSellerLevel0({
    financials: financials([mem("revenue", "10000000000")]),
    sellerCompanyId: "co-a",
    conversationId: "c1",
    industry: "소프트웨어",
    records: [mappedA],
  });
  assert.equal(forA.result.status, "CALCULABLE");
  assert.equal(forA.result.enterpriseValue, 150 * EOK);

  const forB = computeProductionSellerLevel0({
    financials: financials([mem("revenue", "10000000000")]),
    sellerCompanyId: "co-b",
    conversationId: "c1",
    industry: "소프트웨어",
    records: [mappedA],
  });
  assert.equal(forB.lookup.reason, "no_record");
  assert.equal(forB.result.enterpriseValue, null);
});

test("company B cannot read company A benchmark rows", () => {
  const rows = [
    dbRow({ company_id: "co-a", multiple: "2.0", multiple_base: "2.0" }),
    dbRow({ company_id: "co-b", multiple: "3.0", multiple_base: "3.0" }),
  ];
  const onlyB = filterBenchmarkRowsForCompany(rows, "co-b");
  assert.equal(onlyB.length, 1);
  assert.equal(onlyB[0]?.sellerCompanyId, "co-b");
  assert.equal(onlyB[0]?.benchmark.multiple, 3);
  assert.equal(filterBenchmarkRowsForCompany(rows, "co-a")[0]?.benchmark.multiple, 2);
  assert.equal(canReadApprovedValuationBenchmark(viewer("co-b", PlatformRole.SELLER_USER), "co-a"), false);
  assert.equal(canReadApprovedValuationBenchmark(viewer("co-a", PlatformRole.SELLER_USER), "co-a"), true);
  assert.equal(canReadApprovedValuationBenchmark(viewer("co-b", PlatformRole.BUYER_USER), "co-a"), false);
});

test("TEST_ONLY and UNVERIFIED DB rows are not used in production resolve", () => {
  const testOnly = mapApprovedBenchmarkRow(
    dbRow({ approval_status: "TEST_ONLY", source_type: "TEST_FIXTURE" }),
  );
  const unverified = mapApprovedBenchmarkRow(
    dbRow({ approval_status: "UNVERIFIED" }),
  );
  assert.ok(testOnly);
  assert.ok(unverified);

  const testLookup = resolveApprovedEvSalesBenchmark(
    { sellerCompanyId: "co-a", conversationId: null, industry: null },
    [testOnly],
  );
  assert.equal(testLookup.status, "MISSING_BENCHMARK");
  assert.equal(testLookup.reason, "test_only_rejected");
  assert.equal(testLookup.benchmark, null);

  const unverifiedLookup = resolveApprovedEvSalesBenchmark(
    { sellerCompanyId: "co-a", conversationId: null, industry: null },
    [unverified],
  );
  assert.equal(unverifiedLookup.status, "MISSING_BENCHMARK");
  assert.equal(unverifiedLookup.reason, "unverified_rejected");

  const production = computeProductionSellerLevel0({
    financials: financials([mem("revenue", "10000000000")]),
    sellerCompanyId: "co-a",
    conversationId: null,
    industry: "소프트웨어",
    records: [testOnly, unverified],
  });
  assert.equal(production.result.status, "MISSING_BENCHMARK");
  assert.equal(production.result.enterpriseValue, null);
});

test("PLACEHOLDER source rows are not mapped into production records", () => {
  assert.equal(mapApprovedBenchmarkRow(dbRow({ source: "PLACEHOLDER" })), null);
});

test("Seller cannot insert or update a benchmark via client-trusted path", async () => {
  const seller = viewer("co-a", PlatformRole.SELLER_USER);
  assert.equal(canWriteApprovedValuationBenchmark(seller), false);
  const built = buildApprovedBenchmarkInsert(seller, {
    companyId: "co-a",
    benchmark: approvedBenchmark(),
  });
  assert.equal(built.ok, false);
  if (!built.ok) {
    assert.equal(built.reason, "staff_write_required");
  }

  let insertCalled = false;
  const fakeClient = {
    from() {
      return {
        insert() {
          insertCalled = true;
          return {
            select() {
              return {
                single: async () => ({ data: { id: "should-not" }, error: null }),
              };
            },
          };
        },
      };
    },
  };
  const persisted = await persistApprovedEvSalesBenchmark(
    fakeClient as never,
    seller,
    { companyId: "co-a", benchmark: approvedBenchmark() },
  );
  assert.equal(persisted.ok, false);
  assert.equal(insertCalled, false);
});

test("Expert can prepare an APPROVED insert with created_by from CurrentContext", () => {
  const expert = viewer("staff", PlatformRole.EXPERT_USER);
  assert.equal(canWriteApprovedValuationBenchmark(expert), true);
  assert.equal(
    canWriteApprovedBenchmarkForAssignedSeller(expert, "co-a", ["co-a"]),
    true,
  );
  assert.equal(
    canWriteApprovedBenchmarkForAssignedSeller(expert, "co-b", ["co-a"]),
    false,
  );
  const built = buildApprovedBenchmarkInsert(expert, {
    companyId: "co-a",
    benchmark: approvedBenchmark(),
  });
  assert.equal(built.ok, true);
  if (built.ok) {
    assert.equal(built.row.created_by, expert.user.id);
    assert.equal(built.row.company_id, "co-a");
    assert.equal(built.row.approval_status, "APPROVED");
    assert.equal(built.row.source, "internal-review-fixture");
    assert.notEqual(built.row.source, "PLACEHOLDER");
    assert.equal(built.row.method, "EV_SALES");
  }
});

test("Expert can prepare an APPROVED EV/EBITDA insert without using EV/Sales", () => {
  const expert = viewer("staff", PlatformRole.EXPERT_USER);
  const built = buildApprovedBenchmarkInsert(expert, {
    companyId: "co-a",
    benchmark: approvedBenchmark({
      method: "EV_EBITDA",
      multiple: 8,
      multipleBase: 8,
    }),
  });
  assert.equal(built.ok, true);
  if (built.ok) {
    assert.equal(built.row.method, "EV_EBITDA");
    assert.equal(built.row.created_by, expert.user.id);
    assert.equal(built.row.approval_status, "APPROVED");
    assert.notEqual(built.row.method, "EV_SALES");
  }
});

test("duplicate company-scope insert is reported as unique_conflict", async () => {
  const expert = viewer("staff", PlatformRole.EXPERT_USER);
  const fakeClient = {
    from() {
      return {
        insert() {
          return {
            select() {
              return {
                single: async () => ({
                  data: null,
                  error: { code: "23505", message: "duplicate" },
                }),
              };
            },
          };
        },
      };
    },
  };
  const persisted = await persistApprovedEvSalesBenchmark(
    fakeClient as never,
    expert,
    { companyId: "co-a", benchmark: approvedBenchmark() },
  );
  assert.equal(persisted.ok, false);
  if (!persisted.ok) {
    assert.equal(persisted.reason, "unique_conflict");
  }
});

test("EV/EBITDA check constraint rejection is method_check_rejected", async () => {
  const expert = viewer("staff", PlatformRole.EXPERT_USER);
  const fakeClient = {
    from() {
      return {
        insert() {
          return {
            select() {
              return {
                single: async () => ({
                  data: null,
                  error: { code: "23514", message: "check constraint" },
                }),
              };
            },
          };
        },
      };
    },
  };
  const persisted = await persistApprovedEvSalesBenchmark(
    fakeClient as never,
    expert,
    {
      companyId: "co-a",
      benchmark: approvedBenchmark({ method: "EV_EBITDA", multiple: 8, multipleBase: 8 }),
    },
  );
  assert.equal(persisted.ok, false);
  if (!persisted.ok) {
    assert.equal(persisted.reason, "method_check_rejected");
  }
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
