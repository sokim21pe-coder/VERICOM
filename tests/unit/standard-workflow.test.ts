import assert from "node:assert/strict";
import test from "node:test";
import {
  BUYER_WORKFLOW_STAGES,
  getStandardStageByKey,
  getStandardWorkflow,
  SELLER_WORKFLOW_STAGES,
  STANDARD_WORKFLOW_STAGES,
  WORKFLOW_PHASES,
} from "@/lib/deal/standard-workflow";
import {
  BUYER_WORKFLOW,
  SELLER_WORKFLOW,
} from "@/lib/landing/ma-workflow";

const SELLER_LABELS = [
  "초기 상담 및 기업 파악",
  "티저 작성·배포",
  "비밀유지계약 체결",
  "재무자료 정리",
  "자문계약",
  "기업가치 평가",
  "기업소개자료(IM/CIM) 제공",
  "경영진 미팅",
  "인수의향서(IOI) / 인수제안서(LOI)",
  "실사",
  "주식매매계약 협상·체결",
  "거래종결",
  "인수 후 통합",
];

const BUYER_LABELS = [
  "인수조건 설정",
  "인수후보 검토",
  "인수전략 수립",
  "비밀유지계약 체결",
  "매각기업 소개 및 티저 제공",
  "자문계약",
  "기업소개자료(IM/CIM) 검토",
  "경영진 미팅",
  "인수의향서(IOI) / 인수제안서(LOI)",
  "실사",
  "주식매매계약 협상·체결",
  "거래종결",
  "인수 후 통합",
];

const SELLER_KEYS = [
  "SELLER_DISCOVERY",
  "SELLER_TEASER",
  "SELLER_NDA",
  "SELLER_FINANCIAL",
  "SELLER_MANDATE",
  "SELLER_VALUATION",
  "SELLER_IM_CIM",
  "SELLER_MANAGEMENT_MEETING",
  "SELLER_IOI_LOI",
  "SELLER_DUE_DILIGENCE",
  "SELLER_SPA",
  "SELLER_CLOSING",
  "SELLER_PMI",
];

const BUYER_KEYS = [
  "BUYER_CRITERIA",
  "BUYER_TARGET_REVIEW",
  "BUYER_ACQUISITION_STRATEGY",
  "BUYER_NDA",
  "BUYER_TEASER_REVIEW",
  "BUYER_MANDATE",
  "BUYER_IM_CIM_REVIEW",
  "BUYER_MANAGEMENT_MEETING",
  "BUYER_IOI_LOI",
  "BUYER_DUE_DILIGENCE",
  "BUYER_SPA",
  "BUYER_CLOSING",
  "BUYER_PMI",
];

test("seller standard workflow has 13 stages in the confirmed order", () => {
  assert.equal(SELLER_WORKFLOW_STAGES.length, 13);
  assert.deepEqual(
    SELLER_WORKFLOW_STAGES.map((s) => s.key),
    SELLER_KEYS,
  );
  assert.deepEqual(
    SELLER_WORKFLOW_STAGES.map((s) => s.label),
    SELLER_LABELS,
  );
  SELLER_WORKFLOW_STAGES.forEach((s, i) => {
    assert.equal(s.order, i + 1);
    assert.equal(s.side, "SELLER");
  });
});

test("buyer standard workflow has 13 stages in the confirmed order", () => {
  assert.equal(BUYER_WORKFLOW_STAGES.length, 13);
  assert.deepEqual(
    BUYER_WORKFLOW_STAGES.map((s) => s.key),
    BUYER_KEYS,
  );
  assert.deepEqual(
    BUYER_WORKFLOW_STAGES.map((s) => s.label),
    BUYER_LABELS,
  );
  BUYER_WORKFLOW_STAGES.forEach((s, i) => {
    assert.equal(s.order, i + 1);
    assert.equal(s.side, "BUYER");
  });
});

test("stage keys are unique across the whole standard workflow", () => {
  const keys = STANDARD_WORKFLOW_STAGES.map((s) => s.key);
  assert.equal(keys.length, 26);
  assert.equal(new Set(keys).size, 26);
});

test("mandate is the only optional stage and stays in place", () => {
  const optional = STANDARD_WORKFLOW_STAGES.filter((s) => s.optional).map(
    (s) => s.key,
  );
  assert.deepEqual(optional, ["SELLER_MANDATE", "BUYER_MANDATE"]);
  // optional 이어도 순서(위치)는 유지된다: Seller 5번, Buyer 6번.
  assert.equal(getStandardStageByKey("SELLER_MANDATE")?.order, 5);
  assert.equal(getStandardStageByKey("BUYER_MANDATE")?.order, 6);
});

test("every stage maps to a valid deal phase", () => {
  for (const stage of STANDARD_WORKFLOW_STAGES) {
    assert.ok(
      WORKFLOW_PHASES.includes(stage.phase),
      `${stage.key} phase invalid: ${stage.phase}`,
    );
  }
});

test("getStandardWorkflow returns the matching side, ordered", () => {
  assert.deepEqual(
    getStandardWorkflow("SELLER").map((s) => s.key),
    SELLER_KEYS,
  );
  assert.deepEqual(
    getStandardWorkflow("BUYER").map((s) => s.key),
    BUYER_KEYS,
  );
});

test("landing workflow view is derived from the standard SoT without drift", () => {
  assert.equal(SELLER_WORKFLOW.length, SELLER_WORKFLOW_STAGES.length);
  assert.equal(BUYER_WORKFLOW.length, BUYER_WORKFLOW_STAGES.length);

  SELLER_WORKFLOW.forEach((step, i) => {
    const source = SELLER_WORKFLOW_STAGES[i];
    assert.equal(step.key, source.key);
    assert.equal(step.label, source.label);
    assert.equal(step.desc, source.description);
  });
  BUYER_WORKFLOW.forEach((step, i) => {
    const source = BUYER_WORKFLOW_STAGES[i];
    assert.equal(step.key, source.key);
    assert.equal(step.label, source.label);
    assert.equal(step.desc, source.description);
  });
});
