import assert from "node:assert/strict";
import test from "node:test";
import { PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";
import { buildTeaserDraft, revenueBand, type TeaserMemoryInput } from "@/lib/teaser/draft";
import { buildMaskedDescriptor, exposesCompanyName, isUnsafeAnonymousFact } from "@/lib/teaser/identity";
import {
  actionsForStatus,
  canApprove,
  canSubmitForReview,
  canTransition,
  statusAfterEdit,
  teaserStageLabel,
} from "@/lib/teaser/state";
import {
  canApproveTeaser,
  canCreateTeaser,
  canEditTeaser,
  canViewTeaser,
} from "@/lib/teaser/access";
import type { TeaserContent } from "@/lib/teaser/types";

function mem(
  key: string,
  value: string | null,
  informationState = "CONFIRMED",
): TeaserMemoryInput {
  return { key, value, informationState };
}

function findPoint(content: TeaserContent, sectionId: string, pointId: string) {
  const section = content.sections.find((s) => s.id === sectionId);
  return section?.dataPoints.find((p) => p.id === pointId);
}

function sectionBody(content: TeaserContent, sectionId: string): string {
  return content.sections.find((s) => s.id === sectionId)?.body ?? "";
}

function ctx(partial: Partial<CurrentContext>): CurrentContext {
  return {
    user: { id: "user-1", authUserId: "auth-1", email: "a@b.test", displayName: "T" },
    company: { id: "company-A", name: "주식회사테스트", industry: "제조", verificationStatus: "unverified" },
    platformRole: PlatformRole.SELLER_USER,
    platformRoles: [PlatformRole.SELLER_USER],
    companyMembership: null,
    deal: null,
    dealRole: null,
    permissions: [],
    ...partial,
  };
}

// ---------- Identity masking ----------

test("masked descriptor: industry + region, no company name", () => {
  const d = buildMaskedDescriptor({ region: "국내", industry: "산업용 배터리팩" });
  assert.equal(d, "국내 산업용 배터리팩 전문기업");
  assert.ok(!d.includes("주식회사"));
});

test("masked descriptor falls back to generic when no confirmed facts", () => {
  assert.equal(buildMaskedDescriptor({}), "국내 비상장 중소·중견기업");
  assert.equal(
    buildMaskedDescriptor({ region: "경기" }),
    "경기 비상장 중소·중견기업",
  );
});

test("masked descriptor ignores UNKNOWN/SKIPPED tokens", () => {
  assert.equal(
    buildMaskedDescriptor({ region: "UNKNOWN", industry: "SKIPPED" }),
    "국내 비상장 중소·중견기업",
  );
});

test("exposesCompanyName detects leaked name", () => {
  assert.equal(exposesCompanyName("국내 배터리 전문기업 주식회사테스트", "주식회사테스트"), true);
  assert.equal(exposesCompanyName("국내 배터리 전문기업", "주식회사테스트"), false);
  assert.equal(exposesCompanyName("아무 텍스트", null), false);
});

test("isUnsafeAnonymousFact flags unique tokens and raw valuation sentences", () => {
  assert.equal(isUnsafeAnonymousFact("이어가기매각-1788157237100"), true);
  assert.equal(isUnsafeAnonymousFact("매출은 80억이고 EBITDA는 8억 정도야."), true);
  assert.equal(isUnsafeAnonymousFact("산업용 배터리팩"), false);
  assert.equal(isUnsafeAnonymousFact("succession"), false);
});

// ---------- Draft builder ----------

test("draft uses confirmed facts and masks identity by default", () => {
  const content = buildTeaserDraft({
    companyName: "주식회사테스트",
    companyIndustry: "제조",
    memories: [
      mem("industry", "산업용 배터리팩"),
      mem("location", "국내"),
      mem("key_products_services", "배터리팩 설계·제조"),
      mem("competitive_advantage", "자체 BMS 기술"),
    ],
  });
  assert.equal(content.identityMasked, true);
  assert.equal(content.headline, "국내 산업용 배터리팩 전문기업");
  // 회사명이 어떤 섹션 본문에도 노출되지 않는다.
  for (const section of content.sections) {
    assert.ok(!section.body.includes("주식회사테스트"), `leak in ${section.id}`);
  }
  const industry = findPoint(content, "overview", "industry");
  assert.equal(industry?.state, "CONFIRMED");
  assert.equal(industry?.value, "산업용 배터리팩");
});

test("draft marks missing data as UNKNOWN '확인 필요' and never fabricates", () => {
  const content = buildTeaserDraft({
    companyName: null,
    companyIndustry: null,
    memories: [mem("industry", "소프트웨어")],
  });
  const products = findPoint(content, "business", "key_products_services");
  assert.equal(products?.state, "UNKNOWN");
  assert.equal(products?.value, null);
  assert.ok(sectionBody(content, "business").includes("확인 필요"));
  assert.ok(content.missing.includes("주력 제품·서비스"));
  // 매출이 없으면 금액을 지어내지 않는다.
  const revenue = findPoint(content, "financial", "revenue_band");
  assert.equal(revenue?.state, "UNKNOWN");
});

test("draft uses companies.industry when memory industry is absent", () => {
  const content = buildTeaserDraft({
    companyName: "주식회사테스트",
    companyIndustry: "헬스케어",
    memories: [],
  });
  const industry = findPoint(content, "overview", "industry");
  assert.equal(industry?.value, "헬스케어");
  assert.equal(industry?.state, "CONFIRMED");
});

test("draft financial shows band only, never EV/valuation/multiple", () => {
  const content = buildTeaserDraft({
    companyName: null,
    companyIndustry: null,
    memories: [],
    revenueKrw: 15_000_000_000,
  });
  const body = sectionBody(content, "financial");
  assert.ok(body.includes("매출 약 100~300억 원"));
  // 실제 가치/배수 "공개"는 금지(면책 문구에서 '기업가치는 IM에서 제공'은 허용).
  assert.ok(!/\d+\s*배|비교배수|EV\s*\/|multiple/i.test(body));
  // 재무 섹션은 기업가치를 '산출'해 노출하지 않는다: 확정 매출 구간만.
  assert.ok(body.includes("NDA 이후 IM 단계"));
});

test("draft marks ESTIMATED facts with (추정)", () => {
  const content = buildTeaserDraft({
    companyName: null,
    companyIndustry: null,
    memories: [mem("employees", "약 120명", "ESTIMATED")],
  });
  assert.ok(sectionBody(content, "overview").includes("(추정)"));
  const employees = findPoint(content, "overview", "employees");
  assert.equal(employees?.state, "ESTIMATED");
});

test("draft can expose name only when identity released", () => {
  const content = buildTeaserDraft({
    companyName: "주식회사테스트",
    companyIndustry: "제조",
    memories: [mem("industry", "배터리")],
    identityReleased: true,
  });
  assert.equal(content.identityMasked, false);
  assert.equal(content.headline, "주식회사테스트");
});

test("draft drops unique tokens and raw EBITDA sentences (MASTER_SPEC 13.1)", () => {
  const content = buildTeaserDraft({
    companyName: "TEST_DEV_SELLER_CO",
    companyIndustry: null,
    memories: [
      mem("industry", "산업용 배터리팩"),
      mem("key_products_services", "이어가기매각-1788157237100"),
      mem("preferred_structure", "이어가기매각-1788157691072"),
      mem("sale_scope", "매출은 80억이고 EBITDA는 8억 정도야."),
      mem("reason_for_sale", "succession"),
    ],
    revenueKrw: 10_000_000_000,
  });
  assert.equal(content.headline, "국내 산업용 배터리팩 전문기업");
  assert.ok(!content.headline.includes("이어가기매각"));
  assert.ok(!content.headline.includes("TEST_DEV_SELLER_CO"));
  assert.ok(!sectionBody(content, "business").includes("이어가기매각"));
  assert.ok(!sectionBody(content, "transaction").includes("이어가기매각"));
  assert.ok(!sectionBody(content, "transaction").includes("EBITDA"));
  assert.ok(sectionBody(content, "business").includes("확인 필요"));
  assert.ok(sectionBody(content, "transaction").includes("거래 목적: succession"));
  assert.ok(sectionBody(content, "financial").includes("매출 약 100~300억 원"));
  assert.equal(findPoint(content, "business", "key_products_services")?.state, "UNKNOWN");
  assert.equal(findPoint(content, "transaction", "sale_scope")?.state, "UNKNOWN");
});

test("draft does not copy company legal name from USER_CLAIM fields", () => {
  const content = buildTeaserDraft({
    companyName: "TEST_DEV_SELLER_CO",
    companyIndustry: "제조",
    memories: [mem("key_products_services", "TEST_DEV_SELLER_CO 배터리")],
  });
  for (const section of content.sections) {
    assert.ok(!section.body.includes("TEST_DEV_SELLER_CO"), `leak in ${section.id}`);
  }
});

test("revenueBand buckets and rejects invalid", () => {
  assert.equal(revenueBand(null), null);
  assert.equal(revenueBand(0), null);
  assert.equal(revenueBand(-5), null);
  assert.equal(revenueBand(3_000_000_000), "매출 약 50억 원 미만");
  assert.equal(revenueBand(7_000_000_000), "매출 약 50~100억 원");
  assert.equal(revenueBand(400_000_000_000), "매출 약 3,000억 원 이상");
});

// ---------- State machine ----------

test("state transitions follow Draft -> Review -> Approved", () => {
  assert.equal(canTransition("DRAFT", "IN_REVIEW"), true);
  assert.equal(canTransition("IN_REVIEW", "APPROVED"), true);
  assert.equal(canTransition("IN_REVIEW", "DRAFT"), true);
  assert.equal(canTransition("APPROVED", "DRAFT"), true);
});

test("cannot approve directly from DRAFT (explicit review required)", () => {
  assert.equal(canApprove("DRAFT"), false);
  assert.equal(canTransition("DRAFT", "APPROVED"), false);
  assert.equal(canSubmitForReview("DRAFT"), true);
  assert.equal(canApprove("IN_REVIEW"), true);
});

test("editing any status (incl APPROVED) returns to DRAFT, invalidating approval", () => {
  assert.equal(statusAfterEdit(), "DRAFT");
});

test("actionsForStatus reflects allowed actions", () => {
  assert.deepEqual(actionsForStatus("DRAFT"), ["edit", "submit", "preview"]);
  assert.deepEqual(actionsForStatus("IN_REVIEW"), ["edit", "approve", "preview"]);
  assert.deepEqual(actionsForStatus("APPROVED"), ["edit", "preview"]);
});

test("teaserStageLabel covers 작성 전", () => {
  assert.equal(teaserStageLabel(null), "작성 전");
  assert.equal(teaserStageLabel("DRAFT"), "초안");
  assert.equal(teaserStageLabel("IN_REVIEW"), "검토 중");
  assert.equal(teaserStageLabel("APPROVED"), "승인 완료");
});

// ---------- Access guards ----------

test("seller can create/view/edit/approve own company teaser", () => {
  const c = ctx({});
  assert.equal(canCreateTeaser(c), true);
  assert.equal(canViewTeaser(c, "company-A"), true);
  assert.equal(canEditTeaser(c, "company-A"), true);
  assert.equal(canApproveTeaser(c, "company-A"), true);
});

test("cross-company seller is fully blocked", () => {
  const c = ctx({});
  assert.equal(canViewTeaser(c, "company-B"), false);
  assert.equal(canEditTeaser(c, "company-B"), false);
  assert.equal(canApproveTeaser(c, "company-B"), false);
});

test("buyer cannot view/edit/approve any teaser (pre- or post-approval)", () => {
  const buyer = ctx({
    platformRole: PlatformRole.BUYER_USER,
    platformRoles: [PlatformRole.BUYER_USER],
    company: { id: "company-B", name: "Buyer Co", industry: null, verificationStatus: "unverified" },
  });
  assert.equal(canViewTeaser(buyer, "company-A"), false);
  assert.equal(canViewTeaser(buyer, "company-B"), false);
  assert.equal(canEditTeaser(buyer, "company-B"), false);
  assert.equal(canApproveTeaser(buyer, "company-B"), false);
  assert.equal(canCreateTeaser(buyer), false);
});

test("staff (expert/internal) can view but not edit/approve/create", () => {
  for (const role of [PlatformRole.EXPERT_USER, PlatformRole.INTERNAL_DEAL_MANAGER, PlatformRole.ADMIN]) {
    const staff = ctx({
      platformRole: role,
      platformRoles: [role],
      company: null,
    });
    assert.equal(canViewTeaser(staff, "company-A"), true, `${role} view`);
    assert.equal(canEditTeaser(staff, "company-A"), false, `${role} edit`);
    assert.equal(canApproveTeaser(staff, "company-A"), false, `${role} approve`);
    assert.equal(canCreateTeaser(staff), false, `${role} create`);
  }
});

test("seller without company cannot create", () => {
  const c = ctx({ company: null });
  assert.equal(canCreateTeaser(c), false);
});
