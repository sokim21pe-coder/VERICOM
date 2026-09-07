/**
 * VERICOM Standard M&A Operating Workflow — 코드 레벨 단일 Source of Truth.
 *
 * 사용자 확정 표준 거래진행흐름(Seller 13단계 / Buyer 13단계)을 코드 상수로 고정한다.
 * 문서 기준: `docs/MA_STANDARD_WORKFLOW.md`, `MASTER_SPEC.md` §7.7, `docs/DECISIONS.md`(2026-09-07).
 *
 * 규칙:
 * - Seller/Buyer 13단계의 순서·의미·라벨을 임의로 바꾸지 않는다.
 * - 이 파일은 순수 상수/타입 정의이다. DB·enum·migration·persistence·override 로직을 포함하지 않는다.
 * - 실제 Deal의 생략/병행/순서조정(Deal-specific Adjustment)은 향후 Phase C에서 override 구조로 설계한다.
 * - Stage key는 향후 DB persistence / TOM / Deal Timeline 에서 재사용할 수 있도록 안정적으로 유지한다.
 */

export const WORKFLOW_SIDES = ["SELLER", "BUYER"] as const;
export type WorkflowSide = (typeof WORKFLOW_SIDES)[number];

/**
 * 상위 Deal Phase (매핑 전용, 5개). Seller/Buyer 13단계 순서를 대체하지 않는다.
 * PREPARE(준비) → ENGAGE(관여) → EVALUATE(평가) → EXECUTE(실행) → INTEGRATE(통합).
 */
export const WORKFLOW_PHASES = [
  "PREPARE",
  "ENGAGE",
  "EVALUATE",
  "EXECUTE",
  "INTEGRATE",
] as const;
export type WorkflowPhase = (typeof WORKFLOW_PHASES)[number];

/** 단계 객체의 형태 검증용 shape. `as const satisfies`로 리터럴 타입을 유지하면서 형태를 검사한다. */
type StandardWorkflowStageShape = {
  /** 안정적·고유한 코드 key. DB persistence / TOM 에서 재사용. */
  key: string;
  side: WorkflowSide;
  /** 해당 side 내에서의 순서 (1..13). */
  order: number;
  /** 사용자 표시명 (한글). landing UI와 동일 문구. */
  label: string;
  /** 짧은 설명. */
  description: string;
  phase: WorkflowPhase;
  /** 실제 Deal에서 skip 가능 여부. 표준 흐름에는 항상 존재한다. */
  optional: boolean;
  /** side-neutral 개념 stage 식별자 (`docs/MA_STANDARD_WORKFLOW.md` §3 Stage Key). */
  stage: string;
};

const SELLER_STAGES = [
  {
    key: "SELLER_DISCOVERY",
    side: "SELLER",
    order: 1,
    label: "초기 상담 및 기업 파악",
    description: "매각 목표와 회사 현황을 확인하는 첫 단계",
    phase: "PREPARE",
    optional: false,
    stage: "DISCOVERY",
  },
  {
    key: "SELLER_TEASER",
    side: "SELLER",
    order: 2,
    label: "티저 작성·배포",
    description: "회사명을 노출하지 않고 핵심 투자포인트를 제공하는 초기 안내자료",
    phase: "PREPARE",
    optional: false,
    stage: "TEASER",
  },
  {
    key: "SELLER_NDA",
    side: "SELLER",
    order: 3,
    label: "비밀유지계약 체결",
    description: "상세정보 제공 전 기밀유지 의무를 정하는 단계",
    phase: "ENGAGE",
    optional: false,
    stage: "NDA",
  },
  {
    key: "SELLER_FINANCIAL",
    side: "SELLER",
    order: 4,
    label: "재무자료 정리",
    description: "매각 검토에 필요한 재무정보를 정리·정규화",
    phase: "PREPARE",
    optional: false,
    stage: "FINANCIAL",
  },
  {
    key: "SELLER_MANDATE",
    side: "SELLER",
    order: 5,
    label: "자문계약",
    description: "M&A Advisor를 공식 선임해 업무범위·보수·기간·역할을 정하는 계약",
    phase: "ENGAGE",
    optional: true,
    stage: "MANDATE",
  },
  {
    key: "SELLER_VALUATION",
    side: "SELLER",
    order: 6,
    label: "기업가치 평가",
    description: "승인된 비교배수를 기준으로 예비 기업가치 범위를 산정",
    phase: "PREPARE",
    optional: false,
    stage: "VALUATION",
  },
  {
    key: "SELLER_IM_CIM",
    side: "SELLER",
    order: 7,
    label: "기업소개자료(IM/CIM) 제공",
    description: "NDA 이후 상세 사업·재무·거래정보를 제공",
    phase: "ENGAGE",
    optional: false,
    stage: "IM_CIM",
  },
  {
    key: "SELLER_MANAGEMENT_MEETING",
    side: "SELLER",
    order: 8,
    label: "경영진 미팅",
    description: "매각·인수 경영진이 직접 확인하고 질의하는 단계",
    phase: "EVALUATE",
    optional: false,
    stage: "MANAGEMENT_MEETING",
  },
  {
    key: "SELLER_IOI_LOI",
    side: "SELLER",
    order: 9,
    label: "인수의향서(IOI) / 인수제안서(LOI)",
    description: "가격·구조 등 인수 의향을 문서로 제시",
    phase: "EVALUATE",
    optional: false,
    stage: "IOI_LOI",
  },
  {
    key: "SELLER_DUE_DILIGENCE",
    side: "SELLER",
    order: 10,
    label: "실사",
    description: "재무·법률·세무·상업 관점에서 회사를 검증",
    phase: "EVALUATE",
    optional: false,
    stage: "DUE_DILIGENCE",
  },
  {
    key: "SELLER_SPA",
    side: "SELLER",
    order: 11,
    label: "주식매매계약 협상·체결",
    description: "최종 조건을 협상해 주식매매계약(SPA)을 체결",
    phase: "EXECUTE",
    optional: false,
    stage: "SPA",
  },
  {
    key: "SELLER_CLOSING",
    side: "SELLER",
    order: 12,
    label: "거래종결",
    description: "대금 지급과 이전으로 거래를 마무리",
    phase: "EXECUTE",
    optional: false,
    stage: "CLOSING",
  },
  {
    key: "SELLER_PMI",
    side: "SELLER",
    order: 13,
    label: "인수 후 통합",
    description: "거래종결 이후 조직·운영을 통합(PMI)",
    phase: "INTEGRATE",
    optional: false,
    stage: "PMI",
  },
] as const satisfies readonly StandardWorkflowStageShape[];

const BUYER_STAGES = [
  {
    key: "BUYER_CRITERIA",
    side: "BUYER",
    order: 1,
    label: "인수조건 설정",
    description: "산업·규모·수익성·지역 등 인수기준을 설정",
    phase: "PREPARE",
    optional: false,
    stage: "ACQUISITION_CRITERIA",
  },
  {
    key: "BUYER_TARGET_REVIEW",
    side: "BUYER",
    order: 2,
    label: "인수후보 검토",
    description: "기준에 맞는 인수 대상을 검토",
    phase: "PREPARE",
    optional: false,
    stage: "TARGET_REVIEW",
  },
  {
    key: "BUYER_ACQUISITION_STRATEGY",
    side: "BUYER",
    order: 3,
    label: "인수전략 수립",
    description: "인수 목적과 접근 전략을 정리",
    phase: "PREPARE",
    optional: false,
    stage: "ACQUISITION_STRATEGY",
  },
  {
    key: "BUYER_NDA",
    side: "BUYER",
    order: 4,
    label: "비밀유지계약 체결",
    description: "정보 열람을 위한 기밀유지 의무를 정하는 단계",
    phase: "ENGAGE",
    optional: false,
    stage: "NDA",
  },
  {
    key: "BUYER_TEASER_REVIEW",
    side: "BUYER",
    order: 5,
    label: "매각기업 소개 및 티저 제공",
    description: "매각 대상의 티저·초기 정보를 제공받는 단계",
    phase: "ENGAGE",
    optional: false,
    stage: "TEASER_REVIEW",
  },
  {
    key: "BUYER_MANDATE",
    side: "BUYER",
    order: 6,
    label: "자문계약",
    description: "Buy-side Advisor를 공식 선임해 업무범위·보수·기간·역할을 정하는 계약",
    phase: "ENGAGE",
    optional: true,
    stage: "MANDATE",
  },
  {
    key: "BUYER_IM_CIM_REVIEW",
    side: "BUYER",
    order: 7,
    label: "기업소개자료(IM/CIM) 검토",
    description: "제공받은 상세 사업·재무·거래정보를 분석",
    phase: "ENGAGE",
    optional: false,
    stage: "IM_CIM_REVIEW",
  },
  {
    key: "BUYER_MANAGEMENT_MEETING",
    side: "BUYER",
    order: 8,
    label: "경영진 미팅",
    description: "대상 회사 경영진과 직접 확인하는 단계",
    phase: "EVALUATE",
    optional: false,
    stage: "MANAGEMENT_MEETING",
  },
  {
    key: "BUYER_IOI_LOI",
    side: "BUYER",
    order: 9,
    label: "인수의향서(IOI) / 인수제안서(LOI)",
    description: "가격·구조 등 인수 의향을 제시",
    phase: "EVALUATE",
    optional: false,
    stage: "IOI_LOI",
  },
  {
    key: "BUYER_DUE_DILIGENCE",
    side: "BUYER",
    order: 10,
    label: "실사",
    description: "대상 회사를 재무·법률·세무·상업 관점에서 검증",
    phase: "EVALUATE",
    optional: false,
    stage: "DUE_DILIGENCE",
  },
  {
    key: "BUYER_SPA",
    side: "BUYER",
    order: 11,
    label: "주식매매계약 협상·체결",
    description: "최종 조건을 협상해 주식매매계약(SPA)을 체결",
    phase: "EXECUTE",
    optional: false,
    stage: "SPA",
  },
  {
    key: "BUYER_CLOSING",
    side: "BUYER",
    order: 12,
    label: "거래종결",
    description: "대금 지급과 이전으로 거래를 마무리",
    phase: "EXECUTE",
    optional: false,
    stage: "CLOSING",
  },
  {
    key: "BUYER_PMI",
    side: "BUYER",
    order: 13,
    label: "인수 후 통합",
    description: "거래종결 이후 조직·운영을 통합(PMI)",
    phase: "INTEGRATE",
    optional: false,
    stage: "PMI",
  },
] as const satisfies readonly StandardWorkflowStageShape[];

/** Seller 표준 13단계 (order 순서). */
export const SELLER_WORKFLOW_STAGES = SELLER_STAGES;
/** Buyer 표준 13단계 (order 순서). */
export const BUYER_WORKFLOW_STAGES = BUYER_STAGES;

/** Seller + Buyer 전체 표준 단계. */
export const STANDARD_WORKFLOW_STAGES = [
  ...SELLER_STAGES,
  ...BUYER_STAGES,
] as const;

/** 단일 표준 단계 타입 (리터럴 union 보존). */
export type StandardWorkflowStage = (typeof STANDARD_WORKFLOW_STAGES)[number];

/** 모든 안정 stage key의 union. DB persistence / TOM 에서 재사용. */
export type WorkflowStageKey = StandardWorkflowStage["key"];

const STAGE_BY_KEY: ReadonlyMap<string, StandardWorkflowStage> = new Map(
  STANDARD_WORKFLOW_STAGES.map((stage) => [stage.key, stage]),
);

/** side에 해당하는 표준 단계를 order 순서로 반환한다. */
export function getStandardWorkflow(
  side: WorkflowSide,
): readonly StandardWorkflowStage[] {
  return side === "SELLER" ? SELLER_WORKFLOW_STAGES : BUYER_WORKFLOW_STAGES;
}

/** key로 표준 단계를 조회한다. 없으면 undefined. */
export function getStandardStageByKey(
  key: string,
): StandardWorkflowStage | undefined {
  return STAGE_BY_KEY.get(key);
}
