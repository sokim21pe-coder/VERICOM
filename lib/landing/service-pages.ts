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

export type ServiceHighlight = { title: string; body: string };
export type ServiceStep = { order: string; title: string; body: string };
export type ServiceFaqItem = { question: string; answer: string };
export type ServiceFinalCta = {
  title: string;
  body: string;
  primaryLabel: string;
};

/** 상단 메뉴 정보 페이지(기업 매각/인수/전문가/이용안내)의 확장 콘텐츠. */
export type ServiceDetail = {
  heroTagline: string;
  valueProps: ServiceHighlight[];
  features: ServiceHighlight[];
  steps: ServiceStep[];
  audience: string[];
  aiSupport: string[];
  humanSupport: string[];
  security: ServiceHighlight[];
  outcomes: string[];
  faq: ServiceFaqItem[];
  finalCta: ServiceFinalCta;
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
  detail?: ServiceDetail;
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
    detail: {
      heroTagline:
        "매각 준비부터 회사·재무 정리, 예비 기업가치 확인까지 TOM(AI)이 단계별로 안내하고, 필요할 때 M&A 전문가가 함께합니다.",
      valueProps: [
        {
          title: "준비된 매각",
          body: "회사 기본정보와 재무를 구조화해, 협상 이전에 우리 회사의 위치를 먼저 정리합니다.",
        },
        {
          title: "근거 있는 기업가치",
          body: "검증된 비교배수가 있을 때만 기업가치(EV, Enterprise Value) 범위를 제시합니다. 없는 숫자를 추정하지 않습니다.",
        },
        {
          title: "통제된 기밀성",
          body: "승인 기반 정보공개가 원칙입니다. 회사 신원과 IM(투자설명서)은 승인 없이 자동으로 공개되지 않습니다.",
        },
        {
          title: "Direct + Advisory",
          body: "AI가 먼저 돕고, 필요하면 회계·법률·세무 등 전문가 중개자문으로 이어집니다. 모든 대화를 중개자가 대신하는 구조가 아닙니다.",
        },
      ],
      features: [
        {
          title: "Seller Discovery",
          body: "TOM(AI) 매각 상담이 회사와 매각 동기를 한 번에 1~3개 질문으로 정리합니다. 이미 확인된 정보는 다시 묻지 않습니다.",
        },
        {
          title: "재무정보 입력·정규화",
          body: "매출·EBITDA(상각전영업이익)·3개년 실적·순차입 등을 입력하면 계산형 정규화 스냅샷으로 정리합니다. 현금·차입을 임의로 나누지 않습니다.",
        },
        {
          title: "예비 기업가치 LEVEL 0 · LEVEL 1",
          body: "LEVEL 0은 EV/Sales(매출 배수), LEVEL 1은 EV/EBITDA(이익 배수) 방식입니다. 현재 이용 가능한 핵심 기능입니다.",
        },
        {
          title: "티저·Buyer 탐색",
          body: "Teaser(티저) 준비와 인수후보 탐색·Matching은 준비 중입니다. 가짜 후보나 Top3를 보여 주지 않습니다.",
        },
        {
          title: "NDA 이후 정보공개",
          body: "NDA(비밀유지계약) 이후에도 회사명·IM 공개는 승인 기반입니다. 문서 열람 흐름은 준비 중입니다.",
        },
        {
          title: "MM · LOI · DD · SPA · Closing",
          body: "경영진 미팅(Management Meeting), LOI(인수의향서), DD(실사), SPA(주식매매계약), Closing(거래종결)은 표준 프로세스로 설계되어 있으며 실행 흐름은 준비 중입니다.",
        },
      ],
      steps: [
        {
          order: "01",
          title: "회원가입 / 로그인",
          body: "계정을 만들거나 로그인합니다. 상담과 입력값은 계정에 저장됩니다.",
        },
        {
          order: "02",
          title: "이용목적 · 회사 연결",
          body: "이용목적으로 기업 매각을 선택하고, 회사를 연결하거나 신규 등록합니다.",
        },
        {
          order: "03",
          title: "TOM(AI) 매각 상담",
          body: "Seller 워크스페이스에서 회사·매각 동기를 정리하는 Discovery 상담을 진행합니다.",
        },
        {
          order: "04",
          title: "재무 입력 · 정규화",
          body: "매출·EBITDA·3개년 실적·순차입을 입력하면 정규화 스냅샷으로 정리됩니다.",
        },
        {
          order: "05",
          title: "예비 기업가치 확인",
          body: "가치평가 화면에서 LEVEL 0·LEVEL 1 상태와, 승인된 비교배수가 있을 때 기업가치 범위를 확인합니다.",
        },
        {
          order: "06",
          title: "이후 단계 준비",
          body: "티저·Buyer 탐색·NDA·경영진 미팅·LOI·DD·SPA·Closing으로 이어지는 흐름을 준비합니다.",
        },
      ],
      audience: [
        "매각 또는 지분 유동화를 검토 중인 비상장 중소·중견기업 대표·주주",
        "가업승계, 재무적 파트너 유치, 투자유치를 함께 고민하는 기업",
        "협상 이전에 우리 회사의 예비 기업가치와 포지션을 먼저 파악하려는 경영진",
      ],
      aiSupport: [
        "회사·재무 Discovery 질문과 정규화 결과 설명",
        "가치평가 해석, 민감도·리스크 설명, 다음 단계 추천",
        "문서 초안 보조(준비 중) — 최종 확정은 사용자 승인 이후",
      ],
      humanSupport: [
        "비교배수 승인·검증은 Expert(전문가)·Internal(플랫폼 내부)이 담당",
        "회사 신원·IM 공개, 단계 변경 등 민감한 실행은 사용자의 명시적 승인 필요",
        "복잡한 사안은 회계·법률·세무·산업 전문가 중개자문으로 연결",
      ],
      security: [
        {
          title: "승인 기반 정보공개",
          body: "NDA만으로 회사명이나 IM이 자동 공개되지 않습니다. 민감한 공개는 초안 검토 후 명시적 승인을 거칩니다.",
        },
        {
          title: "Buyer 격리",
          body: "Seller와 Buyer의 직접 대화는 Opportunity(1:1 거래 경로) 단위이며, Buyer는 서로의 존재·정보를 볼 수 없습니다.",
        },
        {
          title: "서버가 Source of Truth",
          body: "현재 Context(역할·회사·Active Deal)는 서버가 판정합니다. 클라이언트가 보낸 권한 값을 신뢰하지 않습니다.",
        },
      ],
      outcomes: [
        "협상 이전에 자사 포지션과 예비 기업가치를 근거 있게 정리",
        "기밀을 유지하면서 인수후보 탐색과 다음 단계를 준비",
        "단계별 승인으로 통제된 상태에서 거래를 진행",
      ],
      faq: [
        {
          question: "희망 매각가격을 입력하면 가치평가에 반영되나요?",
          answer:
            "아니요. 사용자의 희망가나 Buyer 예산은 가치평가 엔진의 입력값으로 사용하지 않습니다.",
        },
        {
          question: "검증된 비교배수가 없으면 어떻게 되나요?",
          answer:
            "기업가치 금액을 만들지 않고 「비교배수 확인 필요」 상태로 안내합니다. 임의의 배수를 쓰지 않습니다.",
        },
        {
          question: "DCF로도 계산하나요?",
          answer:
            "현재는 LEVEL 0(EV/Sales)과 LEVEL 1(EV/EBITDA)만 사용합니다. DCF·WACC는 이번 범위에서 사용하지 않습니다.",
        },
        {
          question: "회사명은 언제 공개되나요?",
          answer:
            "승인 없이 자동으로 공개되지 않습니다. 신원·IM 공개는 사용자의 명시적 승인을 거칩니다.",
        },
      ],
      finalCta: {
        title: "매각 준비를 시작하세요",
        body: "TOM(AI) 매각 상담으로 회사와 재무를 정리하고, 근거 기반 예비 기업가치부터 확인해 보세요.",
        primaryLabel: "기업 매각 상담 시작하기",
      },
    },
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
    detail: {
      heroTagline:
        "인수 조건을 구조화하고, 준비된 정보만으로 후보를 검토합니다. Buyer Matching과 문서 열람 흐름은 플랫폼 프로세스 방향으로 준비 중입니다.",
      valueProps: [
        {
          title: "명확한 인수기준",
          body: "산업·매출·EBITDA(상각전영업이익)·지역·지분구조·Deal Size·투자 목적을 구조화해 검토 기준을 명확히 합니다.",
        },
        {
          title: "근거 기반 검토",
          body: "추천 회사나 Top3를 가짜로 보여 주지 않습니다. 준비된 정보와 검증된 자료만 다룹니다.",
        },
        {
          title: "전략적 Fit 중심",
          body: "단순 매물 나열이 아니라, 인수 목적과 전략적 적합도를 중심으로 후보를 정리하는 것을 목표로 합니다.",
        },
        {
          title: "기밀과 격리",
          body: "Buyer 간 정보는 상호 비공개입니다. 관심 표시가 Seller 신원 자동 공개를 의미하지 않습니다.",
        },
      ],
      features: [
        {
          title: "Buyer Discovery · 인수기준 수집",
          body: "TOM(AI) 인수 상담이 인수조건을 한 번에 1~3개 질문으로 모아 정리합니다. 현재 이용 가능한 기능입니다.",
        },
        {
          title: "인수기준 정규화",
          body: "수집한 조건을 계산형 정규화 스냅샷으로 정리합니다. 회사 업종과 인수 대상 산업은 별도 필드로 구분합니다.",
        },
        {
          title: "Buyer Matching · 후보 검토",
          body: "Matching Engine과 후보기업 검토는 준비 중입니다. 준비되기 전에는 후보 목록을 만들지 않습니다.",
        },
        {
          title: "NDA · IM / CIM 검토",
          body: "NDA(비밀유지계약) 이후 IM(투자설명서)·CIM(기업소개서) 검토 흐름은 준비 중입니다.",
        },
        {
          title: "MM · IOI · LOI",
          body: "경영진 미팅(Management Meeting), IOI(투자의향서), LOI(인수의향서)는 표준 프로세스로 설계되어 있으며 실행 흐름은 준비 중입니다.",
        },
        {
          title: "DD · SPA · Closing",
          body: "DD(실사), SPA(주식매매계약), Closing(거래종결)까지 설계되어 있으며, 실행 기능과 Advisor on Demand(필요 시 자문)를 준비합니다.",
        },
      ],
      steps: [
        {
          order: "01",
          title: "회원가입 / 로그인",
          body: "계정을 만들거나 로그인합니다. 상담과 입력값은 계정에 저장됩니다.",
        },
        {
          order: "02",
          title: "이용목적 · 회사 연결",
          body: "이용목적으로 기업 인수를 선택하고, 회사를 연결하거나 신규 등록합니다.",
        },
        {
          order: "03",
          title: "TOM(AI) 인수 상담",
          body: "Buyer 워크스페이스에서 인수 조건을 한 질문씩 정리합니다.",
        },
        {
          order: "04",
          title: "인수기준 정규화",
          body: "수집한 조건이 계산형 스냅샷으로 정리되어 후속 검토의 기준이 됩니다.",
        },
        {
          order: "05",
          title: "후보 검토 준비",
          body: "Matching·후보기업 검토·NDA·IM 검토로 이어지는 흐름을 준비합니다.",
        },
        {
          order: "06",
          title: "이후 단계 준비",
          body: "경영진 미팅·IOI/LOI·DD·SPA·Closing으로 이어지는 프로세스를 설계에 따라 준비합니다.",
        },
      ],
      audience: [
        "전략적 투자자(SI)와 사업 확장을 검토하는 기업",
        "사모펀드(PEF)·재무적 투자자 등 인수 후보를 체계적으로 탐색하려는 투자자",
        "인수 기준과 파이프라인을 명확히 정리하려는 인수·투자 담당(Corporate Development)",
      ],
      aiSupport: [
        "인수 조건 수집 질문과 정규화 결과 설명",
        "후보 분석·전략적 Fit 해석·리스크 설명(준비 중)",
        "검토 자료 초안 보조(준비 중) — 최종 판단은 사용자·전문가",
      ],
      humanSupport: [
        "최종 투자 판단은 인수자 본인의 몫",
        "회계·법률·세무·기술 실사는 자격 전문가가 수행",
        "민감한 실행은 초안 검토 후 사용자의 명시적 승인 필요",
      ],
      security: [
        {
          title: "Buyer 상호 격리",
          body: "Buyer는 다른 Buyer의 존재·메시지·문서·가격·진행상태를 볼 수 없습니다. 직접 대화는 Opportunity 단위입니다.",
        },
        {
          title: "승인 기반 신원공개",
          body: "관심 표시나 NDA 완료만으로 Seller 회사명이나 IM이 자동 공개되지 않습니다.",
        },
        {
          title: "회사 업종 ≠ 인수 대상 산업",
          body: "Buyer 회사의 업종과 인수하려는 Target 산업은 서로 다른 필드로 분리해 관리합니다.",
        },
      ],
      outcomes: [
        "인수 기준을 구조화해 검토 우선순위를 명확화",
        "준비된 정보 기반으로 후보 검토를 준비",
        "기밀과 격리를 유지하며 거래 경로를 진행",
      ],
      faq: [
        {
          question: "지금 후보기업을 바로 볼 수 있나요?",
          answer:
            "Matching Engine은 준비 중입니다. 준비되기 전에는 가짜 후보나 Top3를 보여 주지 않습니다.",
        },
        {
          question: "관심을 표시하면 Seller가 누구인지 바로 알 수 있나요?",
          answer:
            "아니요. Seller 신원 공개는 승인 기반이며 자동으로 이뤄지지 않습니다.",
        },
        {
          question: "다른 Buyer의 정보를 볼 수 있나요?",
          answer:
            "아니요. Buyer 간 정보는 상호 비공개로 격리됩니다.",
        },
        {
          question: "우리 회사 업종과 인수 대상 산업이 섞이지 않나요?",
          answer:
            "별도 필드로 구분해 관리하므로 서로 섞이지 않습니다.",
        },
      ],
      finalCta: {
        title: "인수 조건부터 정리하세요",
        body: "TOM(AI) 인수 상담으로 산업·규모·목적 등 인수 기준을 구조화하고, 검토 준비를 시작해 보세요.",
        primaryLabel: "기업 인수 상담 시작하기",
      },
    },
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
    detail: {
      heroTagline:
        "전문가는 배정된 Deal의 권한 범위 안에서만 업무를 수행합니다. 모든 Deal을 열람하는 구조가 아니라, 초대·배정과 권한(permission) 기반의 Scoped Access입니다.",
      valueProps: [
        {
          title: "배정 기반 참여",
          body: "Deal별 초대와 배정을 통해 참여합니다. 배정되지 않은 Deal의 자료에는 접근할 수 없습니다.",
        },
        {
          title: "Scoped Access",
          body: "권한은 배정된 Deal과 Workstream(업무 범위)으로 제한됩니다. 전문가가 플랫폼의 모든 거래를 볼 수 없습니다.",
        },
        {
          title: "데이터 격리",
          body: "Buyer·Seller 데이터는 역할과 배정 범위에 따라 격리됩니다. 서버와 DB가 권한을 강제합니다.",
        },
        {
          title: "Advisor on Demand",
          body: "AI가 이슈를 정리하고, 필요할 때 자격 전문가가 개입하는 Hybrid 방식입니다. 전문가 개입은 실패가 아닌 정상 경로입니다.",
        },
      ],
      features: [
        {
          title: "Deal별 초대 · 배정",
          body: "전문가는 특정 Deal에 초대·배정되어 참여합니다. 자가 배정은 불가하며 서버가 배정을 관리합니다.",
        },
        {
          title: "권한 범위 내 업무",
          body: "이해상충·비밀유지 절차가 끝나기 전에는 문서에 접근할 수 없습니다. 권한 범위 안에서만 업무를 수행합니다.",
        },
        {
          title: "Valuation Benchmark 승인",
          body: "Expert·Internal은 배정된 Deal의 매각 회사에 한해 승인 비교배수(EV/Sales·EV/EBITDA)를 기록할 수 있습니다. 현재 이용 가능한 기능입니다.",
        },
        {
          title: "DD Workstream 지원",
          body: "FDD(재무실사)·LDD(법률실사)·Tax DD(세무실사)·CDD(상업실사) 등 실사 지원과 Findings·보고서는 준비 중입니다.",
        },
        {
          title: "VDR 접근",
          body: "VDR(가상 데이터룸) 문서 접근은 배정·권한·비밀유지 절차를 전제로 준비 중입니다.",
        },
        {
          title: "협상 · Closing 지원",
          body: "법무·회계·세무·기술 관점의 검토와 협상·Closing(거래종결) 지원은 표준 프로세스로 설계되어 있습니다.",
        },
      ],
      steps: [
        {
          order: "01",
          title: "회원가입 / 로그인",
          body: "계정을 만들거나 로그인합니다.",
        },
        {
          order: "02",
          title: "이용목적 · 전문가",
          body: "이용목적에서 전문가를 선택하고 전문가 워크스페이스로 진입합니다.",
        },
        {
          order: "03",
          title: "Deal 배정 확인",
          body: "배정된 Deal이 있으면 권한 범위와 함께 확인합니다. 배정은 서버가 관리합니다.",
        },
        {
          order: "04",
          title: "권한 범위 내 업무",
          body: "이해상충·비밀유지 절차가 완료된 범위에서 업무를 수행합니다.",
        },
        {
          order: "05",
          title: "비교배수 승인 입력",
          body: "해당하는 경우, 배정 Deal의 매각 회사에 승인 비교배수를 출처·기준일과 함께 기록합니다.",
        },
        {
          order: "06",
          title: "실사 · 보고 준비",
          body: "DD Workstream·Findings·보고서로 이어지는 흐름을 준비합니다.",
        },
      ],
      audience: [
        "M&A Advisor(매각·인수 자문)",
        "회계사·세무사·변호사 등 자격 전문가",
        "기술·산업 전문가 등 특정 영역 검토가 필요한 전문가",
      ],
      aiSupport: [
        "이슈 탐지, 상황 정리, 리스크 식별, 초안 보조",
        "Deal Context 정리와 다음 행동 제안",
        "전문가 판단을 대체하지 않음 — 최종 판단은 전문가",
      ],
      humanSupport: [
        "법률·세무·회계·기술의 최종 판단은 자격 전문가",
        "승인 비교배수 입력은 Expert·Internal이 배정 범위에서만",
        "민감한 실행은 초안 검토 후 명시적 승인 필요",
      ],
      security: [
        {
          title: "Expert Scoped Access",
          body: "전문가는 배정된 Deal과 Workstream 범위만 접근합니다. 배정되지 않은 회사의 자료·비교배수에는 접근·기록할 수 없습니다.",
        },
        {
          title: "자가 배정 불가",
          body: "전문가가 스스로 Deal에 배정될 수 없습니다. 배정 여부는 서버가 강제하며 권한은 DB에서 검증됩니다.",
        },
        {
          title: "Internal과 역할 구분",
          body: "전문가(Expert)와 플랫폼 내부(Internal)의 역할·권한은 구분됩니다. Buyer·Seller 데이터 격리를 유지합니다.",
        },
      ],
      outcomes: [
        "명확한 권한 범위 안에서 안전하게 협업",
        "배정 기반 접근으로 기밀과 이해상충 통제",
        "AI 정리 위에 전문가 판단을 더해 품질 확보",
      ],
      faq: [
        {
          question: "모든 Deal을 볼 수 있나요?",
          answer:
            "아니요. 배정된 Deal의 권한 범위만 접근할 수 있습니다.",
        },
        {
          question: "배정은 스스로 하나요?",
          answer:
            "아니요. 자가 배정은 불가하며 배정은 서버가 관리합니다.",
        },
        {
          question: "비교배수는 누구나 입력할 수 있나요?",
          answer:
            "Expert·Internal이 배정된 Deal의 매각 회사 범위에서만 입력할 수 있습니다. 일반 Seller·Buyer는 입력할 수 없습니다.",
        },
        {
          question: "TOM(AI)이 전문가를 대체하나요?",
          answer:
            "아니요. TOM(AI)은 정리와 보조를 담당하며, 법률·세무·회계·기술의 최종 판단은 전문가가 합니다.",
        },
      ],
      finalCta: {
        title: "전문가로 참여하세요",
        body: "전문가 워크스페이스에서 배정된 Deal의 권한 범위 안에서 업무를 시작할 수 있습니다.",
        primaryLabel: "전문가로 시작하기",
      },
    },
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
    detail: {
      heroTagline:
        "처음 오셨다면 여기서 시작하세요. 회원가입부터 역할 워크스페이스와 TOM(AI) 상담까지, VERICOM 이용 흐름을 한눈에 정리했습니다.",
      valueProps: [
        {
          title: "계정 기반 이용",
          body: "Guest 익명 상담은 제공하지 않습니다. 상담과 입력값은 로그인 계정에 저장되어 이어집니다.",
        },
        {
          title: "역할별 워크스페이스",
          body: "Seller(매각)·Buyer(인수)·Expert(전문가) 각각의 워크스페이스에서 역할에 맞게 진행합니다.",
        },
        {
          title: "승인·권한 중심",
          body: "민감한 공개와 단계 변경은 승인을 거칩니다. 권한은 서버와 DB가 강제합니다.",
        },
        {
          title: "Direct + Advisory",
          body: "AI가 먼저 돕고, 필요할 때 전문가 중개자문으로 이어지는 Hybrid 방식입니다.",
        },
      ],
      features: [
        {
          title: "회원가입 · 로그인",
          body: "이메일 계정으로 가입·로그인합니다.",
        },
        {
          title: "이용목적 선택",
          body: "기업 매각·기업 인수·전문가 중 이용목적을 선택합니다.",
        },
        {
          title: "회사 연결 / 등록",
          body: "기존 회사를 연결하거나 새 회사를 등록합니다. 상담 저장과 워크스페이스 이용의 기준이 됩니다.",
        },
        {
          title: "TOM(AI) 상담 · 정보 입력",
          body: "역할 워크스페이스에서 TOM(AI)과 상담하고 필요한 정보를 입력합니다. 이미 확인된 정보는 다시 묻지 않습니다.",
        },
        {
          title: "권한 · 승인 · Deal 진행",
          body: "권한 범위 안에서 Deal을 단계별로 진행합니다. 초기 시장은 Seller-first이며 MVP는 경영진 미팅까지입니다.",
        },
        {
          title: "기밀성 · VDR · 중개자문",
          body: "기밀 유지와 VDR(가상 데이터룸), 전문가 초대·중개자문 요청은 프로세스 방향으로 준비 중입니다.",
        },
      ],
      steps: [
        {
          order: "01",
          title: "회원가입 / 로그인",
          body: "계정을 만들거나 로그인합니다.",
        },
        {
          order: "02",
          title: "이용목적 선택",
          body: "기업 매각·기업 인수·전문가 중에서 목적을 고릅니다.",
        },
        {
          order: "03",
          title: "회사 연결 / 신규등록",
          body: "회사를 연결하거나 새로 등록합니다.",
        },
        {
          order: "04",
          title: "역할 워크스페이스",
          body: "선택한 역할의 워크스페이스로 진입합니다.",
        },
        {
          order: "05",
          title: "TOM(AI) 상담",
          body: "역할에 맞는 상담을 진행하고 정보를 입력합니다.",
        },
        {
          order: "06",
          title: "Deal 진행",
          body: "권한과 승인 안에서 다음 단계를 이어갑니다.",
        },
      ],
      audience: [
        "VERICOM을 처음 사용하는 매각기업 대표·주주",
        "인수·투자를 검토하는 기업·투자자",
        "Deal에 참여하는 회계·법률·세무·산업 전문가",
      ],
      aiSupport: [
        "온보딩 안내와 역할별 상담 진행",
        "입력 정보 정리와 다음 단계 안내",
        "필요 시 전문가 중개자문 연결 제안",
      ],
      humanSupport: [
        "회사·권한 확인과 승인 절차",
        "전문가 배정·검토가 필요한 사안 연결",
        "민감한 실행은 사용자의 명시적 승인 필요",
      ],
      security: [
        {
          title: "계정·회사·역할 기반 권한",
          body: "이용은 계정 연결을 전제로 하며, 권한은 회사와 역할에 따라 부여됩니다.",
        },
        {
          title: "서버가 Source of Truth",
          body: "현재 Context는 서버가 판정하며 Active Deal을 최신 행으로 자동 선택하지 않습니다.",
        },
        {
          title: "기밀·격리 유지",
          body: "Buyer 격리, 회사 데이터 격리, 전문가 Scoped Access를 유지합니다.",
        },
      ],
      outcomes: [
        "역할에 맞는 빠른 온보딩",
        "상담과 입력값이 계정에 저장되어 이어짐",
        "승인·권한 안에서 통제된 진행",
      ],
      faq: [
        {
          question: "익명으로 먼저 사용해 볼 수 있나요?",
          answer:
            "Guest 익명 상담은 제공하지 않습니다. 계정을 연결한 뒤 이용할 수 있습니다.",
        },
        {
          question: "지금은 어디까지 이용할 수 있나요?",
          answer:
            "상담·재무입력·예비 기업가치 LEVEL 0/1 등이 가능합니다. Matching과 문서(NDA·IM 등) 흐름은 준비 중입니다.",
        },
        {
          question: "회사를 꼭 등록해야 하나요?",
          answer:
            "역할 워크스페이스 이용과 상담 저장을 위해 회사 연결 또는 신규 등록이 필요합니다.",
        },
        {
          question: "전문가는 어떻게 참여하나요?",
          answer:
            "전문가는 Deal별 배정·초대를 통해 권한 범위 안에서 참여합니다.",
        },
      ],
      finalCta: {
        title: "지금 시작해 보세요",
        body: "회원가입 후 이용목적을 선택하고 회사를 연결하면, 역할에 맞는 워크스페이스와 TOM(AI) 상담을 바로 이용할 수 있습니다.",
        primaryLabel: "지금 시작하기",
      },
    },
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
