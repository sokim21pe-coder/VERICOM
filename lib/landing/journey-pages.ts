import { consultPath } from "@/lib/tom/paths";
import { MACRO_MA_PROCESS } from "@/lib/deal/macro-process";
import { MacroMaProcessStage } from "@/types/enums";
import type { LandingServicePage } from "@/lib/landing/service-pages";

export const LANDING_JOURNEY_SLUGS = [
  "teaser-l1",
  "nda",
  "advisory-l2",
  "mandate",
  "cim-im",
  "loi",
  "dd",
  "spa",
  "closing",
  "pmi",
] as const;

export type LandingJourneySlug = (typeof LANDING_JOURNEY_SLUGS)[number];

const SLUG_BY_STAGE: Record<MacroMaProcessStage, LandingJourneySlug> = {
  [MacroMaProcessStage.TEASER_L1]: "teaser-l1",
  [MacroMaProcessStage.NDA]: "nda",
  [MacroMaProcessStage.ADVISORY_L2]: "advisory-l2",
  [MacroMaProcessStage.MANDATE]: "mandate",
  [MacroMaProcessStage.CIM_IM]: "cim-im",
  [MacroMaProcessStage.LOI]: "loi",
  [MacroMaProcessStage.DD]: "dd",
  [MacroMaProcessStage.SPA]: "spa",
  [MacroMaProcessStage.CLOSING]: "closing",
  [MacroMaProcessStage.PMI]: "pmi",
};

export function journeyProcessHref(stage: MacroMaProcessStage): string {
  return `/about/process/${SLUG_BY_STAGE[stage]}`;
}

const sellConsult = consultPath("sell");
const sectionHref = "/#journey";

const pages: Record<LandingJourneySlug, LandingServicePage> = {
  "teaser-l1": {
    slug: "teaser-l1",
    href: "/about/process/teaser-l1",
    kicker: "01",
    title: "티저·LEVEL 1 가치평가",
    lead: "전략수립·딜소싱·매각준비와 LEVEL 1 가치평가를 포함하는 첫 단계입니다.",
    paragraphs: [
      "티저(Teaser)는 회사명을 가린 짧은 소개 자료입니다. 실제 티저 작성과 Buyer 배포는 아직 준비 중입니다.",
      "로그인 후 Seller 가치평가에서 LEVEL 0(EV/Sales)와 LEVEL 1(EV/EBITDA) 상태를 확인할 수 있습니다. 검증된 비교배수가 있을 때만 기업가치 범위를 표시합니다.",
    ],
    available: [
      "계정 연결 후 TOM(AI) 매각 상담과 Seller 가치평가 화면을 이용할 수 있습니다.",
    ],
    upcoming: [
      "티저 문서 생성, Seller 승인 후 Buyer Outreach는 후속 단계입니다.",
    ],
    loginNext: "/seller/valuation",
    intent: "sell",
    startIntent: null,
    showStartCta: false,
    sectionHref,
  },
  nda: {
    slug: "nda",
    href: "/about/process/nda",
    kicker: "02",
    title: "NDA",
    lead: "NDA는 비밀유지계약입니다. 완료만으로 회사명이나 IM(투자설명서)이 공개되지 않습니다.",
    paragraphs: [
      "신원 공개(Identity Release)와 IM 공개는 NDA와 별도 승인입니다. 메시지 접근과 신원/IM 접근은 독립입니다.",
      "중개자가 모든 대화를 대신해야만 진행되는 구조가 아닙니다. Opportunity 단위 직접 커뮤니케이션이 원칙입니다.",
    ],
    available: [
      "로그인 후 매각·인수 상담을 시작할 수 있습니다. 회사 범위 Private Storage로 자료를 관리합니다.",
    ],
    upcoming: [
      "NDA 문서 작성·서명·완료 상태와 Buyer Outreach는 준비 중입니다.",
    ],
    loginNext: sellConsult,
    intent: "sell",
    startIntent: null,
    showStartCta: false,
    sectionHref,
  },
  "advisory-l2": {
    slug: "advisory-l2",
    href: "/about/process/advisory-l2",
    kicker: "03",
    title: "매각자문 제안·LEVEL 2 가치평가",
    lead: "매각 자문 제안과 정밀 예비가치(LEVEL 2)를 다루는 단계입니다.",
    paragraphs: [
      "LEVEL 2는 정규화 EBITDA, 운전자본, 리스크를 반영한 정밀 배수·DCF(현금흐름할인법) 보조를 목표로 합니다.",
      "현재 제품은 LEVEL 0/1만 계산합니다. LLM이 WACC(가중평균자본비용)나 최종 숫자를 만들지 않습니다.",
    ],
    available: [
      "로그인 후 LEVEL 0/1 가치평가 상태와 승인 비교배수를 확인할 수 있습니다.",
    ],
    upcoming: [
      "매각자문 제안서, LEVEL 2 DCF, Expert-verified 정밀 가치는 준비 중입니다.",
    ],
    loginNext: "/seller/valuation",
    intent: "sell",
    startIntent: null,
    showStartCta: false,
    sectionHref,
  },
  mandate: {
    slug: "mandate",
    href: "/about/process/mandate",
    kicker: "04",
    title: "Mandate",
    lead: "Mandate는 매각 위임 범위와 자문 개입 조건을 정하는 단계입니다.",
    paragraphs: [
      "플랫폼 안 Matching → Seller 승인 → Invitation → Opportunity 직접 커뮤니케이션은 Self-Service에서도 가능하며, 시작부터 Exclusive Mandate를 요구하지 않습니다.",
      "플랫폼 밖 대량 Cold Call은 Exclusive Mandate 또는 Internal Advisory Engagement가 있을 때만 보조 Flow입니다.",
    ],
    available: [
      "로그인 후 이용목적과 회사 연결, TOM(AI) 상담을 진행할 수 있습니다.",
    ],
    upcoming: [
      "Mandate 문서, Exclusive 조건, 자문 수수료 확정은 후속 단계입니다.",
    ],
    loginNext: sellConsult,
    intent: "sell",
    startIntent: null,
    showStartCta: false,
    sectionHref,
  },
  "cim-im": {
    slug: "cim-im",
    href: "/about/process/cim-im",
    kicker: "05",
    title: "CIM / IM",
    lead: "CIM/IM은 투자설명서입니다. 열람은 NDA 완료와 별도 IM 공개 승인이 필요합니다.",
    paragraphs: [
      "IM 열람은 `NDA_COMPLETED + IM_RELEASE_APPROVED`입니다. 보기와 다운로드는 분리합니다.",
      "기본 권장 흐름은 CIM/IM → Q&A → 경영진 미팅(MM) → LOI입니다. 이 랜딩 10단계 카드에는 Q&A·MM이 별도 칸으로 아직 없습니다.",
    ],
    available: [
      "로그인 후 회사 자료실(Private Storage)로 파일을 보관할 수 있습니다.",
    ],
    upcoming: [
      "IM 작성, 공개 승인, Buyer 열람/다운로드 Gate는 준비 중입니다.",
    ],
    loginNext: "/seller/docs",
    intent: "sell",
    startIntent: null,
    showStartCta: false,
    sectionHref,
  },
  loi: {
    slug: "loi",
    href: "/about/process/loi",
    kicker: "06",
    title: "LOI",
    lead: "LOI는 인수의향서입니다. 경영진 미팅(MM) 이후가 기본 권장 흐름입니다.",
    paragraphs: [
      "Buyer가 MM 없이 LOI를 내면 생략 사유를 기록한 뒤 LOI로 갈 수 있습니다. MM은 Deal 전체가 아니라 Opportunity(Buyer) 단위입니다.",
      "LOI 전에는 중개자만 커뮤니케이션한다는 구조는 만들지 않습니다.",
    ],
    available: [
      "로그인 후 매각·인수 상담을 시작할 수 있습니다.",
    ],
    upcoming: [
      "Q&A, 경영진 미팅, LOI 초안·승인·서명은 준비 중입니다.",
    ],
    loginNext: sellConsult,
    intent: "sell",
    startIntent: null,
    showStartCta: false,
    sectionHref,
  },
  dd: {
    slug: "dd",
    href: "/about/process/dd",
    kicker: "07",
    title: "DD",
    lead: "DD는 실사입니다. FDD / LDD / Tax DD / CDD는 배정 Deal Workstream 범위 안에서만 수행합니다.",
    paragraphs: [
      "이해상충·비밀유지 절차가 끝나기 전에는 문서에 접근할 수 없습니다. TOM(AI)은 초안·요약만 하고 최종 전문판단은 전문가가 검증합니다.",
    ],
    available: [
      "로그인 후 전문가 워크스페이스에 들어갈 수 있습니다. 승인 비교배수 기록은 가능합니다.",
    ],
    upcoming: [
      "Workstream 생성, Finding·Evidence, Expert 원본 보고서와 TOM(AI) 요약 분리는 준비 중입니다.",
    ],
    loginNext: "/expert",
    intent: null,
    startIntent: null,
    showStartCta: false,
    sectionHref,
  },
  spa: {
    slug: "spa",
    href: "/about/process/spa",
    kicker: "08",
    title: "SPA",
    lead: "SPA는 주식매매계약입니다. 최종 협상과 계약 조건을 다룹니다.",
    paragraphs: [
      "중요한 실행은 초안 → 검토 → 명시적 승인 → 실행 → 기록 순서를 지킵니다. AI가 서명을 대신하지 않습니다.",
    ],
    available: [
      "로그인 후 TOM(AI) 상담으로 거래 질문을 정리할 수 있습니다.",
    ],
    upcoming: [
      "SPA 초안, 조건 협상 화면, 서명·승인 Gate는 준비 중입니다.",
    ],
    loginNext: sellConsult,
    intent: "sell",
    startIntent: null,
    showStartCta: false,
    sectionHref,
  },
  closing: {
    slug: "closing",
    href: "/about/process/closing",
    kicker: "09",
    title: "Closing",
    lead: "Closing은 거래 종결입니다. AI가 Closing을 임의로 확정하지 않습니다.",
    paragraphs: [
      "대금 결제, 지분 이전, 선행조건 충족은 사람 승인과 기록이 필요합니다.",
    ],
    available: [
      "로그인 후 계정에 상담과 회사 자료를 남길 수 있습니다.",
    ],
    upcoming: [
      "Closing 체크리스트, 실제 종결 승인, 대외 공시는 준비 중입니다.",
    ],
    loginNext: sellConsult,
    intent: "sell",
    startIntent: null,
    showStartCta: false,
    sectionHref,
  },
  pmi: {
    slug: "pmi",
    href: "/about/process/pmi",
    kicker: "10",
    title: "PMI",
    lead: "PMI는 인수 후 통합입니다. Closing 이후 확장 모듈입니다.",
    paragraphs: [
      "조직·시스템·고객 통합은 거래 종결 다음 단계입니다. 현재 MVP 범위의 끝이 아닙니다.",
    ],
    available: [
      "로그인 후 매각·인수 상담을 시작할 수 있습니다.",
    ],
    upcoming: [
      "PMI 워크스페이스, 통합 과제, 시너지 추적은 후속 단계입니다.",
    ],
    loginNext: sellConsult,
    intent: "sell",
    startIntent: null,
    showStartCta: false,
    sectionHref,
  },
};

export function isLandingJourneySlug(
  value: string,
): value is LandingJourneySlug {
  return (LANDING_JOURNEY_SLUGS as readonly string[]).includes(value);
}

export function getLandingJourneyPage(
  slug: string,
): LandingServicePage | null {
  if (!isLandingJourneySlug(slug)) return null;
  return pages[slug];
}

export function landingJourneyHrefs(): string[] {
  return MACRO_MA_PROCESS.map((step) => journeyProcessHref(step.id));
}
