import assert from "node:assert/strict";
import test from "node:test";
import {
  canContextTransitionSellerStage,
  isValidSellerStageKey,
  parseSellerStageTransition,
  SELLER_STAGE_WRITE_ROLES,
  STAGE_TRANSITION_SOURCES,
} from "@/lib/deal/seller-stage-transition";
import { SELLER_WORKFLOW_STAGES } from "@/lib/deal/standard-workflow";
import type { CurrentContext } from "@/types/context";
import { DealRole } from "@/types/enums";

const DEAL_A = "11111111-1111-4111-8111-111111111111";
const DEAL_B = "22222222-2222-4222-8222-222222222222";

function contextWith(
  overrides: Partial<CurrentContext> & {
    dealId?: string | null;
    dealRole?: DealRole | null;
  } = {},
): CurrentContext {
  const { dealId, dealRole, ...rest } = overrides;
  return {
    user: {
      id: "user-1",
      authUserId: "auth-1",
      email: "s@example.com",
      displayName: "Seller",
    },
    company: null,
    platformRole: null,
    platformRoles: [],
    companyMembership: null,
    deal: dealId === null ? null : { id: dealId ?? DEAL_A, title: null },
    dealRole: dealRole === undefined ? DealRole.SELLER_OWNER : dealRole,
    permissions: [],
    ...rest,
  };
}

test("all 13 seller workflow keys are valid seller stage keys", () => {
  for (const stage of SELLER_WORKFLOW_STAGES) {
    assert.equal(isValidSellerStageKey(stage.key), true, stage.key);
  }
});

test("buyer keys and garbage are rejected as seller stage keys", () => {
  assert.equal(isValidSellerStageKey("BUYER_NDA"), false);
  assert.equal(isValidSellerStageKey("BUYER_CRITERIA"), false);
  assert.equal(isValidSellerStageKey("SELLER_UNKNOWN"), false);
  assert.equal(isValidSellerStageKey("nonsense"), false);
  assert.equal(isValidSellerStageKey(""), false);
});

test("write roles are seller owner/operator + internal manager only", () => {
  assert.deepEqual([...SELLER_STAGE_WRITE_ROLES], [
    DealRole.SELLER_OWNER,
    DealRole.SELLER_OPERATOR,
    DealRole.INTERNAL_MANAGER,
  ]);
});

test("canContextTransitionSellerStage enforces active deal + writable role", () => {
  assert.equal(
    canContextTransitionSellerStage(
      contextWith({ dealId: DEAL_A, dealRole: DealRole.SELLER_OWNER }),
      DEAL_A,
    ),
    true,
  );
  // 다른 Deal id 요청은 불가 (cross-deal isolation)
  assert.equal(
    canContextTransitionSellerStage(
      contextWith({ dealId: DEAL_A, dealRole: DealRole.SELLER_OWNER }),
      DEAL_B,
    ),
    false,
  );
  // Buyer 역할 불가
  assert.equal(
    canContextTransitionSellerStage(
      contextWith({ dealId: DEAL_A, dealRole: DealRole.BUYER_OWNER }),
      DEAL_A,
    ),
    false,
  );
  // Advisor 이번 단계 제외
  assert.equal(
    canContextTransitionSellerStage(
      contextWith({ dealId: DEAL_A, dealRole: DealRole.SELLER_ADVISOR }),
      DEAL_A,
    ),
    false,
  );
  // 활성 Deal 없음
  assert.equal(
    canContextTransitionSellerStage(contextWith({ dealId: null }), DEAL_A),
    false,
  );
  assert.equal(canContextTransitionSellerStage(null, DEAL_A), false);
});

test("parse rejects when unauthenticated", () => {
  const r = parseSellerStageTransition(null, {
    dealId: DEAL_A,
    toStageKey: "SELLER_NDA",
  });
  assert.deepEqual(r, { ok: false, reason: "auth_required" });
});

test("parse rejects deal mismatch", () => {
  const r = parseSellerStageTransition(
    contextWith({ dealId: DEAL_A, dealRole: DealRole.SELLER_OWNER }),
    { dealId: DEAL_B, toStageKey: "SELLER_NDA" },
  );
  assert.deepEqual(r, { ok: false, reason: "deal_mismatch" });
});

test("parse rejects buyer role as permission_denied", () => {
  const r = parseSellerStageTransition(
    contextWith({ dealId: DEAL_A, dealRole: DealRole.BUYER_OWNER }),
    { dealId: DEAL_A, toStageKey: "SELLER_NDA" },
  );
  assert.deepEqual(r, { ok: false, reason: "permission_denied" });
});

test("parse rejects invalid + buyer-side stage key", () => {
  const bad = parseSellerStageTransition(
    contextWith({ dealId: DEAL_A, dealRole: DealRole.SELLER_OWNER }),
    { dealId: DEAL_A, toStageKey: "BUYER_NDA" },
  );
  assert.deepEqual(bad, { ok: false, reason: "invalid_stage_key" });
});

test("parse rejects invalid transition source", () => {
  const r = parseSellerStageTransition(
    contextWith({ dealId: DEAL_A, dealRole: DealRole.SELLER_OWNER }),
    { dealId: DEAL_A, toStageKey: "SELLER_NDA", source: "AI_GUESS" },
  );
  assert.deepEqual(r, { ok: false, reason: "invalid_source" });
});

test("parse accepts a valid seller transition and normalizes note/source", () => {
  const r = parseSellerStageTransition(
    contextWith({ dealId: DEAL_A, dealRole: DealRole.INTERNAL_MANAGER }),
    { dealId: DEAL_A, toStageKey: "SELLER_VALUATION", note: "  기업가치 착수  " },
  );
  assert.deepEqual(r, {
    ok: true,
    dealId: DEAL_A,
    toStageKey: "SELLER_VALUATION",
    note: "기업가치 착수",
    source: "USER_ACTION",
  });
});

test("parse allows any valid stage as target (no rigid order / mandate not forced)", () => {
  // Mandate(5번)를 건너뛰고 IM/CIM(7번)로 바로 전환 가능해야 한다 (Deal-specific adjustment 대비).
  const r = parseSellerStageTransition(
    contextWith({ dealId: DEAL_A, dealRole: DealRole.SELLER_OWNER }),
    { dealId: DEAL_A, toStageKey: "SELLER_IM_CIM" },
  );
  assert.equal(r.ok, true);
});

test("empty note becomes null; explicit source preserved", () => {
  const r = parseSellerStageTransition(
    contextWith({ dealId: DEAL_A, dealRole: DealRole.SELLER_OWNER }),
    { dealId: DEAL_A, toStageKey: "SELLER_CLOSING", note: "   ", source: "STAFF_ACTION" },
  );
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.note, null);
    assert.equal(r.source, "STAFF_ACTION");
  }
});

test("transition source whitelist excludes AI-inferred values", () => {
  assert.deepEqual([...STAGE_TRANSITION_SOURCES], [
    "USER_ACTION",
    "STAFF_ACTION",
    "SYSTEM",
  ]);
});
