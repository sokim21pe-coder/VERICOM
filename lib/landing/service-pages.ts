import {
  consultPath,
  loginHref,
  signupHref,
  type TomIntent,
} from "@/lib/tom/paths";

export const LANDING_SERVICE_SLUGS = [
  "valuation",
  "matching",
  "confidential",
  "experts",
  "sell",
  "buy",
  "expert",
  "guide",
  "tom",
] as const;

export type LandingServiceSlug = (typeof LANDING_SERVICE_SLUGS)[number];

export type LandingValueCard = {
  slug: Extract<
    LandingServiceSlug,
    "valuation" | "matching" | "confidential" | "experts"
  >;
  href: string;
  title: string;
  copy: string;
};

export type LandingServicePage = {
  slug: string;
  href: string;
  kicker: string;
  title: string;
  lead: string;
  paragraphs: string[];
  available: string[];
  upcoming: string[];
  loginNext: string;
  intent: TomIntent | null;
  startIntent: TomIntent | null;
  showStartCta: boolean;
  sectionHref?: string;
  sectionLabel?: string;
  hideBackLinks?: boolean;
};

export const LANDING_VALUE_CARDS: LandingValueCard[] = [
  {
    slug: "valuation",
    href: "/about/valuation",
    title: "기업가치 예비평가",
    copy: "몇 가지 핵심 정보를 바탕으로 가치 범위를 빠르게 확인",
  },
  {
    slug: "matching",
    href: "/about/matching",
    title: "인수후보 Top3",
    copy: "전략적 적합도 기반 Buyer 후보 탐색",
  },
  {
    slug: "confidential",
    href: "/about/confidential",
    title: "기밀 거래관리",
    copy: "승인 기반 정보공개와 단계별 권한통제",
  },
  {
    slug: "experts",
    href: "/about/experts",
    title: "전문가 협업",
    copy: "회계·법률·세무·산업 전문가와 DD(실사) 협업",
  },
];

export const LANDING_SELL_HREF = "/about/sell";
export const LANDING_BUY_HREF = "/about/buy";
export const LANDING_EXPERT_HREF = "/about/expert";
export const LANDING_GUIDE_HREF = "/about/guide";
export const LANDING_TOM_HREF = "/about/tom";

const pages: Record<LandingServiceSlug, LandingServicePage> = {
  valuation: {
    slug: "valuation",
    href: "/about/valuation",
    kicker: "01",
    title: "기업가치 예비평가",
    lead: "몇 가지 핵심 정보를 바탕으로 가치 범위를 빠르게 확인합니다.",
    paragraphs: [
      "로그인 후 Seller 워크스페이스와 TOM(AI) 매각 상담에서 재무 입력을 이어갑니다. LLM이 EBITDA, 배수, 기업가치 최종 숫자를 만들지 않습니다.",
    ],
    available: [
      "가치평가 화면에서 LEVEL 0(EV/Sales)와 LEVEL 1(EV/EBITDA) 상태를 확인합니다.",
      "검증된 비교배수가 있을 때만 기업가치(Enterprise Value) 범위를 표시합니다.",
      "Expert/Internal은 배정 Deal 매각 회사에 승인 비교배수를 기록할 수 있습니다.",
    ],
    upcoming: [
      "DCF, WACC, 시장 스크랩 배수는 사용하지 않습니다.",
      "승인된 비교배수가 없으면 가치 범위를 보여 주지 않습니다.",
    ],
    loginNext: "/seller/valuation",
    intent: "sell",
    startIntent: "sell",
    showStartCta: true,
  },
  matching: {
    slug: "matching",
    href: "/about/matching",
    kicker: "02",
    title: "인수후보 Top3",
    lead: "전략적 적합도 기준 Buyer 후보 탐색을 목표로 합니다.",
    paragraphs: [
      "Matching Engine과 Top3 추천은 아직 준비 중입니다. 가짜 후보 회사나 접촉 버튼을 보여 주지 않습니다.",
    ],
    available: [
      "로그인 후 Buyer 워크스페이스에서 인수조건을 정리할 수 있습니다.",
      "TOM(AI) 인수 상담에서 조건을 한 질문씩 모읍니다.",
    ],
    upcoming: [
      "Buyer Matching, Opportunity, 추천 회사 목록은 후속 단계입니다.",
      "관심 표시와 Seller 접촉은 아직 열리지 않습니다.",
    ],
    loginNext: "/buyer",
    intent: "buy",
    startIntent: "buy",
    showStartCta: true,
  },
  confidential: {
    slug: "confidential",
    href: "/about/confidential",
    kicker: "03",
    title: "기밀 거래관리",
    lead: "승인 기반 정보공개와 단계별 권한통제가 원칙입니다.",
    paragraphs: [
      "Seller 신원 공개와 IM(투자설명서) 공개는 메시지 접근과 별개입니다. NDA(비밀유지계약) 완료만으로 회사명이나 IM이 공개되지 않습니다.",
      "중요한 공개와 단계 변경은 초안 검토 후 명시적 승인이 필요합니다. 중개자가 모든 대화를 대신해야만 진행되는 구조가 아닙니다.",
    ],
    available: [
      "로그인 후 회사 멤버십과 Private Storage로 자료를 회사 범위에서 관리합니다.",
      "CurrentContext는 서버가 Source of Truth이며 Active Deal을 최신 행으로 자동 선택하지 않습니다.",
    ],
    upcoming: [
      "NDA, IM, LOI(인수의향서), DD(실사) 문서 흐름은 준비 중입니다.",
      "거래 문서함은 아직이며 가짜 계약 상태를 만들지 않습니다.",
    ],
    loginNext: "/seller",
    intent: "sell",
    startIntent: "sell",
    showStartCta: true,
  },
  experts: {
    slug: "experts",
    href: "/about/experts",
    kicker: "04",
    title: "전문가 협업",
    lead: "회계·법률·세무·산업 전문가와 DD(실사) 협업을 목표로 합니다.",
    paragraphs: [
      "TOM(AI)은 인간 전문가를 대체하지 않습니다. 법률·세무·회계 판단은 전문가 검토가 필요합니다.",
    ],
    available: [
      "로그인 후 전문가 워크스페이스에 들어갈 수 있습니다.",
      "Expert/Internal은 승인 비교배수를 기록할 수 있습니다.",
      "TOM(AI) 상담은 계정에 저장됩니다.",
    ],
    upcoming: [
      "Deal 배정, FDD/LDD/Tax DD Workstream, Findings, 보고서는 준비 중입니다.",
      "DD·SPA 실행 기능은 이번에 열리지 않습니다.",
    ],
    loginNext: "/expert",
    intent: null,
    startIntent: null,
    showStartCta: false,
  },
  sell: {
    slug: "sell",
    href: LANDING_SELL_HREF,
    kicker: "S01",
    title: "기업 매각",
    lead: "우리 회사 지금 얼마일까요?",
    paragraphs: [
      "계정 연결 후 TOM(AI)과 매각 상담을 시작합니다. 첫 질문은 「회사와 관련해 요즘 가장 고민되는 것이 무엇인가요?」입니다.",
      "실제 Buyer 접촉 전에는 회사·권한 확인이 필요합니다. 신원과 IM 공개는 승인 없이 자동으로 이뤄지지 않습니다.",
      "베리컴은 중개자가 모든 대화를 전달해야만 진행되는 구조가 아닙니다. Cold Call은 기본 UX가 아닙니다.",
    ],
    available: [
      "로그인 후 매각 상담과 Seller 가치평가 LEVEL 0/1을 이용할 수 있습니다.",
    ],
    upcoming: [
      "Teaser, NDA, IM, Buyer Top3, LOI는 준비 중입니다.",
    ],
    loginNext: consultPath("sell"),
    intent: "sell",
    startIntent: "sell",
    showStartCta: false,
  },
  buy: {
    slug: "buy",
    href: LANDING_BUY_HREF,
    kicker: "S01",
    title: "기업 인수",
    lead: "어떤 회사를 찾고 계신가요?",
    paragraphs: [
      "계정 연결 후 인수 조건을 상담합니다. 첫 질문은 「어떤 회사를 찾고 계신가요?」입니다.",
      "관심 표시는 Seller 신원 자동 공개를 의미하지 않으며, NDA 완료만으로 회사명이나 IM이 공개되지 않습니다.",
      "Matching Engine은 준비 전입니다. 추천 회사나 Top3를 가짜로 보여 주지 않습니다.",
    ],
    available: [
      "로그인 후 인수 상담과 Buyer 워크스페이스에서 인수조건을 정리할 수 있습니다.",
    ],
    upcoming: [
      "Matching, Opportunity, 추천 Deal, NDA/IM 열람은 후속 단계입니다.",
    ],
    loginNext: consultPath("buy"),
    intent: "buy",
    startIntent: "buy",
    showStartCta: false,
  },
  expert: {
    slug: "expert",
    href: LANDING_EXPERT_HREF,
    kicker: "S01",
    title: "전문가",
    lead: "배정 Deal의 Workstream 범위 안에서만 전문 업무를 수행합니다.",
    paragraphs: [
      "FDD / LDD / Tax DD / CDD 등 전문 업무는 배정 Deal의 Workstream 범위 안에서만 수행합니다. 이해상충·비밀유지 절차가 끝나기 전에는 문서에 접근할 수 없습니다.",
      "TOM(AI)은 인간 전문가를 대체하지 않습니다. 법률·세무·회계 최종 판단은 전문가 검토가 필요합니다. 중개자가 모든 대화를 대신해야만 진행되는 구조가 아닙니다.",
    ],
    available: [
      "로그인 후 전문가 워크스페이스에 들어갈 수 있습니다.",
      "배정 Deal이 있으면 승인 비교배수를 기록할 수 있습니다.",
    ],
    upcoming: [
      "Deal 배정 UI, FDD/LDD/Tax DD Workstream 실행, Findings, 원본 보고서는 준비 중입니다.",
      "이해상충·비밀유지 Gate와 DD 문서 접근은 후속 단계입니다.",
    ],
    loginNext: "/expert",
    intent: null,
    startIntent: null,
    showStartCta: false,
  },
  guide: {
    slug: "guide",
    href: LANDING_GUIDE_HREF,
    kicker: "S01",
    title: "이용안내",
    lead: "랜딩에서 계정 연결 후 역할 워크스페이스와 TOM(AI) 상담으로 이어집니다.",
    paragraphs: [
      "랜딩 → 회원가입 또는 로그인 → 이용목적 선택 → 회사 연결 또는 신규등록 → 역할 워크스페이스 → TOM(AI) 상담.",
      "초기 시장은 Seller-first이며, MVP는 Management Meeting(경영진 미팅)까지입니다. Guest 익명 상담은 하지 않습니다.",
    ],
    available: [
      "로그인·회원가입 후 이용목적과 회사 연결을 진행할 수 있습니다.",
      "Seller는 매각 상담과 가치평가, Buyer는 인수조건 정리를 이용할 수 있습니다.",
    ],
    upcoming: [
      "회사·권한 Verification, Teaser·NDA·IM 문서 연결은 후속 단계입니다.",
      "TOM(AI)의 실제 LLM 모델 연동과 Matching은 준비 중입니다.",
    ],
    loginNext: "/onboarding/purpose",
    intent: null,
    startIntent: null,
    showStartCta: false,
  },
  tom: {
    slug: "tom",
    href: LANDING_TOM_HREF,
    kicker: "S01",
    title: "TOM(AI)",
    lead: "거래의 다음 단계를 안내합니다.",
    paragraphs: [
      "TOM(AI)는 챗봇이 아니라 M&A Deal Copilot / Operating Agent입니다. 단순히 질문에 답하는 것을 넘어, 실제 Deal과 현재 Context를 이해하고 분석·판단·추천·초안작성·다음 행동 제안까지 지원하는 것을 목표로 합니다. 인간 경력이나 실제 Deal 경험이 있다고 허위로 말하지 않습니다.",
      "TOM(AI)은 세 개의 층으로 동작합니다. ① Knowledge — 전략, 기업가치평가, Deal Structure, Teaser·NDA·IM·LOI·DD·SPA·Closing·PMI 등 Sell-side와 Buy-side 실무 지식. ② Deal Context — User·Company·Platform Role·Active Deal·Deal Role·Deal Stage·Permission·Structured Memory를 함께 보고 맥락에 맞게 답하는 층. ③ Action — 분석·리스크 식별·추천·문서 초안·다음 행동으로 이어지는 실행 층.",
      "같은 질문이라도 Seller와 Buyer에게 답이 다릅니다. 예를 들어 「LOI 독점기간 3개월 괜찮나요?」에 대해 Seller에게는 가격 확정도·협상력·No-shop 리스크를, Buyer에게는 DD 확보·경쟁 차단·Financing 확보 관점을 중심으로 설명합니다.",
      "중요한 실행은 항상 「이해 → 분석 → 추천 → 초안 → 승인 요청 → 실행 → 기록」 순서를 지킵니다. Seller 신원 공개, IM 공개, NDA·Deal 단계 변경, LOI·SPA 확정 같은 민감한 실행은 초안을 만든 뒤 사용자의 명시적 승인 없이는 진행하지 않습니다.",
      "가치평가에서 LLM은 설명·비교·민감도·리스크·추천만 담당하고, EBITDA·WACC·배수·기업가치(EV)·지분가치 같은 최종 숫자는 만들지 않습니다. 최종 숫자는 결정형 계산 엔진과 검증된 비교배수에서 나옵니다.",
      "상담은 로그인 계정에 저장됩니다. Guest 익명 상담은 하지 않습니다. 진입은 랜딩 → 회원가입 또는 로그인 → 이용목적 선택 → 회사 연결 또는 신규등록 → 역할 워크스페이스 → TOM(AI) 상담입니다.",
      "이후 티저, NDA(비밀유지계약), IM(투자설명서), LOI(인수의향서), DD(실사) 자료와 연결할 수 있도록 준비합니다. TOM(AI)은 메시지 전달 중개자가 아니며, 중개자가 모든 대화를 대신해야만 진행되는 구조가 아닙니다. 상황이 복잡하면 회계·법률·세무·산업 전문가의 VERICOM 중개자문 요청으로 연결할 수 있고, 이는 실패가 아니라 Self-Service → AI 보조 → 자문 보조 → 전문가 보조로 이어지는 정상 경로입니다.",
    ],
    available: [
      "로그인 후 매각 상담과 인수 상담을 계정에 저장할 수 있습니다.",
      "Seller는 가치평가 LEVEL 0/1 상태를 확인하고, Buyer는 인수조건을 한 질문씩 정리할 수 있습니다.",
      "현재 Context(역할·회사·Active Deal)에 따라 Seller와 Buyer에게 다르게 답합니다.",
    ],
    upcoming: [
      "티저·NDA·IM·LOI·DD 문서 연결과 실제 LLM 모델 연동은 준비 중입니다.",
      "Matching Engine과 Opportunity 메시징, VERICOM 중개자문 요청은 후속 단계입니다.",
    ],
    loginNext: "/onboarding/purpose",
    intent: null,
    startIntent: null,
    showStartCta: false,
    sectionHref: "/#tom",
    sectionLabel: "TOM(AI)",
    hideBackLinks: true,
  },
};

export function isLandingServiceSlug(
  value: string,
): value is LandingServiceSlug {
  return (LANDING_SERVICE_SLUGS as readonly string[]).includes(value);
}

export function getLandingServicePage(
  slug: string,
): LandingServicePage | null {
  if (!isLandingServiceSlug(slug)) return null;
  return pages[slug];
}

export function serviceAuthHrefs(page: LandingServicePage): {
  login: string;
  signup: string;
} {
  return {
    login: loginHref(page.loginNext, page.intent),
    signup: signupHref(page.loginNext, page.intent),
  };
}

export function landingSectionBackLabel(page: LandingServicePage): string {
  if (page.sectionLabel) return page.sectionLabel;
  if (page.sectionHref === "/#journey") return "거래 진행 흐름";
  return "서비스 소개";
}
