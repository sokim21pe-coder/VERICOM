import assert from "node:assert/strict";
import test from "node:test";
import { DealRole, PlatformRole } from "@/types/enums";
import type { AccessibleDeal, CurrentContext } from "@/types/context";
import { canWriteApprovedBenchmarkForAssignedSeller } from "@/lib/tom/access";
import {
  assignedSellerCompanyIds,
  parseStaffApprovedBenchmarkForm,
  staffBenchmarkTargetsFromDeals,
  type StaffBenchmarkFormInput,
} from "@/lib/valuation/staff-benchmark-write";

function viewer(role: PlatformRole, companyId: string | null): CurrentContext {
  return {
    user: {
      id: `u-${role}`,
      authUserId: `a-${role}`,
      email: `${role}@test`,
      displayName: role,
    },
    company: companyId
      ? {
          id: companyId,
          name: companyId,
          industry: null,
          verificationStatus: "unverified",
        }
      : null,
    platformRole: role,
    platformRoles: [role],
    companyMembership: null,
    deal: null,
    dealRole: null,
    permissions: [],
  };
}

function assignedDeal(
  companyId: string,
  title = "TEST_DEV_DEAL_A",
): AccessibleDeal {
  return {
    id: `deal-${companyId}`,
    title,
    dealRole: DealRole.EXPERT,
    sellerCompanyId: companyId,
  };
}

function validForm(
  overrides: Partial<StaffBenchmarkFormInput> = {},
): StaffBenchmarkFormInput {
  return {
    companyId: "co-s",
    dealId: "deal-co-s",
    multipleLow: "",
    multipleBase: "1.4",
    multipleHigh: "",
    source: "내부 검토 기록",
    sourceType: "INTERNAL_REVIEW",
    asOfDate: "2026-09-01",
    industry: "소프트웨어",
    confidence: "LOW",
    confirmed: true,
    ...overrides,
  };
}

test("staff targets come from assigned deal seller companies only", () => {
  const targets = staffBenchmarkTargetsFromDeals([
    assignedDeal("co-s"),
    {
      id: "deal-empty",
      title: "no seller",
      dealRole: DealRole.EXPERT,
      sellerCompanyId: null,
    },
    assignedDeal("co-s", "duplicate company"),
    assignedDeal("co-other", "other deal"),
  ]);
  assert.deepEqual(
    targets.map((item) => item.companyId),
    ["co-s", "co-other"],
  );
  assert.equal(assignedSellerCompanyIds([assignedDeal("co-s")]).includes("co-s"), true);
});

test("Seller cannot parse an APPROVED benchmark write", () => {
  const parsed = parseStaffApprovedBenchmarkForm(
    viewer(PlatformRole.SELLER_USER, "co-s"),
    validForm(),
    ["co-s"],
  );
  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.equal(parsed.reason, "staff_write_required");
  }
});

test("Expert cannot write a company that is not on an assigned Deal", () => {
  const expert = viewer(PlatformRole.EXPERT_USER, null);
  assert.equal(
    canWriteApprovedBenchmarkForAssignedSeller(expert, "co-other", ["co-s"]),
    false,
  );
  const parsed = parseStaffApprovedBenchmarkForm(
    expert,
    validForm({ companyId: "co-other" }),
    ["co-s"],
  );
  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.equal(parsed.reason, "assigned_company_required");
  }
});

test("missing provenance, PLACEHOLDER, TEST_FIXTURE, and confirmation are rejected", () => {
  const expert = viewer(PlatformRole.EXPERT_USER, null);
  const assigned = ["co-s"];

  const noDate = parseStaffApprovedBenchmarkForm(
    expert,
    validForm({ asOfDate: "" }),
    assigned,
  );
  assert.equal(noDate.ok, false);
  if (!noDate.ok) assert.equal(noDate.reason, "missing_provenance");

  const placeholder = parseStaffApprovedBenchmarkForm(
    expert,
    validForm({ source: "PLACEHOLDER" }),
    assigned,
  );
  assert.equal(placeholder.ok, false);
  if (!placeholder.ok) assert.equal(placeholder.reason, "source_required");

  const testFixture = parseStaffApprovedBenchmarkForm(
    expert,
    validForm({ sourceType: "TEST_FIXTURE" }),
    assigned,
  );
  assert.equal(testFixture.ok, false);
  if (!testFixture.ok) assert.equal(testFixture.reason, "source_type_not_allowed");

  const unverifiedType = parseStaffApprovedBenchmarkForm(
    expert,
    validForm({ sourceType: "UNKNOWN" }),
    assigned,
  );
  assert.equal(unverifiedType.ok, false);
  if (!unverifiedType.ok) {
    assert.equal(unverifiedType.reason, "source_type_not_allowed");
  }

  const unconfirmed = parseStaffApprovedBenchmarkForm(
    expert,
    validForm({ confirmed: false }),
    assigned,
  );
  assert.equal(unconfirmed.ok, false);
  if (!unconfirmed.ok) assert.equal(unconfirmed.reason, "confirmation_required");

  const noMultiple = parseStaffApprovedBenchmarkForm(
    expert,
    validForm({ multipleLow: "", multipleBase: "", multipleHigh: "" }),
    assigned,
  );
  assert.equal(noMultiple.ok, false);
  if (!noMultiple.ok) assert.equal(noMultiple.reason, "multiple_missing");
});

test("Expert assigned seller company parses APPROVED EV/Sales with provenance", () => {
  const expert = viewer(PlatformRole.EXPERT_USER, null);
  const parsed = parseStaffApprovedBenchmarkForm(
    expert,
    validForm(),
    ["co-s"],
  );
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.companyId, "co-s");
  assert.equal(parsed.benchmark.method, "EV_SALES");
  assert.equal(parsed.benchmark.approvalStatus, "APPROVED");
  assert.equal(parsed.benchmark.sourceType, "INTERNAL_REVIEW");
  assert.equal(parsed.benchmark.asOfDate, "2026-09-01");
  assert.equal(parsed.benchmark.multiple, 1.4);
  assert.notEqual(parsed.benchmark.source, "PLACEHOLDER");
  assert.notEqual(parsed.benchmark.approvalStatus, "TEST_ONLY");
  assert.notEqual(parsed.benchmark.approvalStatus, "UNVERIFIED");
  assert.equal(parsed.benchmark.provenance?.sourceType, "INTERNAL_REVIEW");
});
