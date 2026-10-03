/**
 * TOM(AI) 상세 Product Page 콘텐츠 (표시용).
 *
 * 성격: 정보/브랜드 페이지 콘텐츠. Auth·DB·Engine·Permission 등 제품 로직을 포함하지 않는다.
 * Source of Truth: `docs/TOM_STRATEGY.md`, `docs/TOM_ARCHITECTURE.md`, `MASTER_SPEC.md`(0.3·0.4·8·9·20절).
 * 표현 원칙: 과장·허위 자동화·미구현 기능을 현재 작동처럼 서술하지 않는다(단계 구분은 available/upcoming 사용).
 */

export type TomHero = {
  kicker: string;
  headline: string;
  lead: string;
  sub: string;
  ctaLabel: string;
};

export type TomCapability = { title: string; body: string };

export type TomBrain = {
  name: string;
  role: string;
};

export type TomLoopStep = { step: string; note: string };

export type TomMemory = { title: string; body: string };

export type TomLayer = {
  title: string;
  scope: string;
  items: string[];
};

export type TomToolClass = {
  code: "READ" | "ANALYSIS" | "DRAFT" | "ACTION";
  title: string;
  body: string;
  gated: boolean;
};

export type TomWorkflowLink = { title: string; body: string };

export type TomSecurityItem = { title: string; body: string };

export const TOM_HERO: TomHero = {
  kicker: "TOM(AI) · AI M&A DEAL AGENT",
  headline: "TOM — 거래를 이끄는 AI M&A Deal Agent",
  lead: "TOM은 단순 챗봇이 아니라 VERICOM의 중앙 AI M&A Deal Agent이자 거래 전체를 Orchestrate하는 AI Deal Manager입니다.",
  sub: "질문에 답하는 데서 끝나지 않고, 현재 Deal Context를 이해하고, 다음 행동을 판단하며, 승인된 업무를 실제 거래 Workflow와 연결합니다.",
  ctaLabel: "TOM과 상담하기",
};

/** TOM의 역할 — 사용자의 M&A 여정에서 수행하는 일. */
export const TOM_ROLE_LEAD =
  "TOM은 사용자의 M&A 목적을 이해하고, 거래를 다음 단계로 이끄는 것을 목표로 합니다. 하나의 대화 안에서 다음을 함께 수행합니다.";

export const TOM_ROLE_CAPABILITIES: TomCapability[] = [
  { title: "M&A 목적 파악", body: "사용자가 매각·인수·투자 중 무엇을 원하는지, 그 배경과 제약을 이해합니다." },
  { title: "Deal Context 확인", body: "역할·회사·Active Deal·단계·권한을 함께 보고 지금 상황에 맞게 판단합니다." },
  { title: "누락정보 식별", body: "무엇이 확인되었고 무엇이 부족한지 구분해, 반복 질문 없이 필요한 것만 요청합니다." },
  { title: "분석", body: "가치평가·후보 적합도·리스크 등 판단에 필요한 분석을 정리해 설명합니다." },
  { title: "Next Best Action 추천", body: "현재 거래에서 가장 가치 있는 다음 행동을 찾아 제안합니다." },
  { title: "문서 초안", body: "티저·아웃리치·DD 질의 등 초안을 준비합니다. 확정은 사용자 승인 이후입니다." },
  { title: "승인 확인", body: "민감한 실행 전에는 권한과 명시적 승인 여부를 반드시 확인합니다." },
  { title: "Tool 실행", body: "승인·권한이 확인된 범위에서만 조회·분석·초안·실행 도구를 사용합니다." },
  { title: "거래 행동 기록", body: "Activity·Decision·Outcome를 남겨 이후 판단의 근거로 축적합니다." },
];

/** One TOM outside, Specialist Functions inside — 내부에서 협력하는 전문 기능 7가지. */
export const TOM_SPECIALIST_LEAD =
  "사용자는 하나의 TOM과 대화합니다. 그 안에서 TOM은 M&A 실무의 전문 기능을 상황에 맞게 조율합니다. 여러 AI를 각각 다루는 것이 아니라, 한 명의 고도화된 Deal Agent로 경험됩니다.";

export const TOM_BRAINS: TomBrain[] = [
  { name: "Strategy", role: "거래 목적·구조·접근 전략을 정리합니다." },
  { name: "Valuation", role: "가치평가 결과를 해석하고 민감도·전제를 설명합니다." },
  { name: "Matching", role: "전략적 적합도를 기준으로 후보를 분석합니다." },
  { name: "Document", role: "티저·NDA·IM·LOI 등 거래 문서 초안을 준비합니다." },
  { name: "Risk", role: "거래를 막을 수 있는 리스크와 확인 필요사항을 짚습니다." },
  { name: "Deal Manager", role: "현재 단계를 관리하고 다음 행동을 추천합니다." },
  { name: "DD Orchestrator", role: "실사 항목과 전문가 협업을 조율합니다." },
];

/** Agent Loop — TOM의 판단/행동 순서. */
export const TOM_AGENT_LOOP: TomLoopStep[] = [
  { step: "Understand", note: "요청과 의도 이해" },
  { step: "Identify Context", note: "역할·회사·Deal·권한 확인" },
  { step: "Retrieve", note: "필요한 정보 조회" },
  { step: "Separate Confirmed / Estimated / Unknown", note: "확인·추정·미확인 구분" },
  { step: "Analyze", note: "분석·판단" },
  { step: "Recommend", note: "다음 행동 추천" },
  { step: "Draft", note: "문서·메시지 초안" },
  { step: "Approval Check", note: "권한·승인 확인" },
  { step: "Execute Tool", note: "승인된 범위에서 실행" },
  { step: "Record Activity / Task", note: "행동·결정 기록" },
];

export const TOM_AGENT_LOOP_NOTE =
  "TOM은 바로 실행하지 않습니다. 권한과 승인 여부를 반드시 확인한 뒤에만 도구를 실행합니다.";

/** TOM Leads the Deal — Proactive Agent. */
export const TOM_LEADS_MESSAGE =
  "TOM은 사용자가 다음 질문을 할 때까지 기다리는 AI가 아니라, 현재 거래에서 가장 가치 있는 다음 행동을 찾아 제안합니다.";

export const TOM_LEADS_CONSIDERATIONS: string[] = [
  "현재 거래 단계",
  "다음 행동",
  "부족한 정보",
  "Blocking Risk",
  "필요한 승인",
  "필요한 전문가",
  "필요한 문서",
  "Follow-up",
];

/** Continuous Deal Intelligence — Memory 축적. */
export const TOM_INTELLIGENCE_LEAD =
  "TOM은 대화할 때마다 AI 모델 자체가 재학습되는 것이 아닙니다. 대신 거래 과정에서 정보를 구조적으로 축적해, 거래가 진행될수록 Context가 깊어지는 AI Agent입니다.";

export const TOM_MEMORY: TomMemory[] = [
  { title: "Conversation Memory", body: "현재 대화의 단기 맥락을 유지합니다." },
  { title: "Company Memory", body: "회사정보·산업·재무·사업특성을 구조화해 기억합니다." },
  { title: "Deal Memory", body: "거래목적·단계·조건·Buyer 상태를 기억합니다." },
  { title: "Decision Memory", body: "사용자의 승인·거절·선호를 기억합니다." },
  { title: "Negative Memory", body: "제외 Buyer·Do-not-disclose·접촉 금지·실패한 접근을 기억합니다." },
  { title: "Intent & Relationship", body: "Buyer/Seller 의향과 관계·거래 결과를 축적합니다." },
];

export const TOM_INTELLIGENCE_BENEFITS: string[] = [
  "같은 정보를 반복해서 묻지 않음",
  "사용자의 선호 기억",
  "제외 Buyer·Do-not-disclose 기억",
  "이전 접근 결과 기억",
  "Deal Outcome 기반 향후 판단 향상",
];

export const TOM_INTELLIGENCE_NOTE =
  "확인되지 않은 정보는 Fact로 저장하지 않습니다. 모든 중요 정보는 CONFIRMED · ESTIMATED · UNKNOWN으로 구분합니다.";

/** AI / Engine / Expert 분리. */
export const TOM_LAYERS: TomLayer[] = [
  {
    title: "TOM AI",
    scope: "분석 · 추천 · 초안 · 설명",
    items: ["상황 정리와 리스크 식별", "다음 행동 추천", "문서·메시지 초안", "결과 해석과 의미 설명"],
  },
  {
    title: "Financial & Rule Engine",
    scope: "숫자 · Rule · Permission",
    items: ["EBITDA·배수·EV 등 계산", "승인된 비교배수 기준 적용", "권한·규칙 강제", "결정형(deterministic) 계산"],
  },
  {
    title: "Human & Expert",
    scope: "승인 · 계약 · 전문판단",
    items: ["중요 공개·접촉·계약 승인", "회계·법률·세무 판단", "DD 최종 판단", "거래에 대한 최종 책임"],
  },
];

export const TOM_LAYERS_NOTE =
  "TOM(AI)은 Multiple·EBITDA·WACC·EV 같은 최종 숫자를 임의로 만들지 않습니다. 최종 숫자는 결정형 계산 엔진과 검증된 비교배수에서 나옵니다.";

/** From Conversation to Execution — Tool Class. */
export const TOM_TOOL_CLASSES: TomToolClass[] = [
  { code: "READ", title: "정보 조회", body: "권한 필터를 통과한 회사·Deal 상태를 조회합니다.", gated: false },
  { code: "ANALYSIS", title: "분석", body: "Valuation·Matching·DD Summary 등 분석을 수행합니다.", gated: false },
  { code: "DRAFT", title: "초안 작성", body: "Teaser·Outreach·DD Question 등 초안을 준비합니다.", gated: false },
  { code: "ACTION", title: "실행", body: "Buyer Contact·IM Access·Expert Assignment 등 외부/상태 변경을 실행합니다.", gated: true },
];

export const TOM_TOOL_NOTE =
  "ACTION은 사용자 승인과 권한 검증 이후에만 실행됩니다. 승인 없이 정보를 공개하거나 상태를 바꾸지 않습니다.";

/** M&A Workflow Connection — TOM이 각 단계에서 연결하는 것. */
export const TOM_WORKFLOW_LEAD =
  "TOM은 VERICOM Standard M&A Workflow 전 단계에서 거래를 연결합니다. 표준 순서 자체는 사용자가 확정한 SoT를 따르며, TOM이 임의로 바꾸지 않습니다.";

export const TOM_WORKFLOW_LINKS: TomWorkflowLink[] = [
  { title: "Context", body: "각 단계에서 현재 상황과 확인된 정보를 정리합니다." },
  { title: "Next Action", body: "표준 흐름과 현재 데이터를 함께 보고 다음 행동을 제안합니다." },
  { title: "Document", body: "단계에 맞는 문서 초안을 준비합니다." },
  { title: "Risk", body: "단계별 리스크와 확인 필요사항을 짚습니다." },
  { title: "Approval", body: "민감한 공개·변경 전 승인 여부를 확인합니다." },
  { title: "Expert", body: "필요한 시점에 적합한 전문가 개입을 연결합니다." },
];

export const TOM_WORKFLOW_STAGE_NOTE =
  "TOM은 실제 Deal Stage를 임의로 확정하지 않습니다. 단계 변경의 기준은 사용자 행동·승인·실제 Event입니다.";

/** Security — AI Permission Ceiling. */
export const TOM_SECURITY_HEADLINE = "AI Permission = User Permission Ceiling";
export const TOM_SECURITY_LEAD = "TOM도 사용자가 볼 수 없는 정보를 볼 수 없습니다.";

export const TOM_SECURITY_ITEMS: TomSecurityItem[] = [
  { title: "Permission Filter", body: "데이터는 Context → Permission Filter → AI 순서로만 전달됩니다." },
  { title: "Buyer Isolation", body: "Buyer는 다른 Buyer의 존재·정보를 볼 수 없습니다." },
  { title: "Expert Scoped Access", body: "전문가는 배정된 Deal과 Workstream 범위만 접근합니다." },
  { title: "Seller Approval", body: "신원·IM 공개 등 민감한 공개는 Seller의 명시적 승인을 거칩니다." },
  { title: "Audit", body: "중요한 조회·분석·실행은 감사 가능하게 기록됩니다." },
  { title: "Private Data", body: "회사·Deal 데이터는 역할과 회사 범위로 격리됩니다." },
];

export const TOM_SECURITY_INJECTION_NOTE =
  "외부 문서·웹 내용은 Instruction이 아니라 Data로 취급합니다. 외부 자료가 TOM의 규칙·권한·승인 절차를 바꾸지 못합니다.";

/** Human-in-the-loop. */
export const TOM_HITL_LINES = ["AI leads.", "Human approves.", "Expert verifies."];
export const TOM_HITL_BODY =
  "TOM이 거래를 리딩하지만, 중요한 공개·접촉·계약·전문판단은 사람과 전문가가 최종 승인합니다. 전문가 중개자문은 실패가 아니라 Self-Service → AI 보조 → 자문 보조 → 전문가 보조로 이어지는 정상 경로입니다.";
