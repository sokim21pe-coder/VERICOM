import { StartConsultButtons } from "@/components/landing/StartConsultButtons";

const container = "mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10";
const sectionPad = "py-16 sm:py-20 lg:py-24";
const h2Class =
  "break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem] sm:leading-[1.2]";
const leadClass =
  "mt-4 max-w-2xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8";

function AccentBar() {
  return (
    <span
      aria-hidden="true"
      className="mb-5 block h-1 w-10 rounded-full bg-navy"
    />
  );
}

type Stage = { label: string; body: string };

const SELLER_FLOW: Stage[] = [
  { label: "기업매각 준비", body: "매각 목표와 시점, 우선순위를 정리합니다." },
  { label: "회사 정보 정리", body: "사업·조직·재무 등 핵심 정보를 구조화합니다." },
  { label: "가치평가", body: "매출·이익 기반으로 예비 기업가치 범위를 확인합니다." },
  { label: "Teaser(티저)", body: "회사를 특정하지 않고 핵심만 담은 요약 자료를 준비합니다." },
  { label: "Buyer 탐색", body: "전략적 적합도를 기준으로 인수후보를 찾습니다." },
  { label: "NDA(비밀유지계약)", body: "정보공개에 앞서 비밀유지 조건을 확정합니다." },
  { label: "IM / CIM(투자설명서)", body: "회사와 거래를 설명하는 상세 자료를 공유합니다." },
  { label: "경영진 미팅(MM)", body: "Seller·Buyer 경영진이 직접 확인하고 질의합니다." },
  { label: "IOI / LOI(인수의향서)", body: "가격·구조 등 인수 의향을 문서로 제시합니다." },
  { label: "실사(DD)", body: "재무·법률·세무·상업 관점에서 회사를 검증합니다." },
  { label: "SPA(주식매매계약)", body: "최종 조건을 확정해 매매계약을 체결합니다." },
  { label: "Closing(거래종결)", body: "대금 지급과 이전으로 거래를 마무리합니다." },
];

const BUYER_FLOW: Stage[] = [
  { label: "인수전략 수립", body: "인수 목적과 방향, 투자 논리를 정리합니다." },
  { label: "Acquisition Criteria(인수기준)", body: "산업·규모·수익성·지역 등 기준을 구조화합니다." },
  { label: "Target 탐색", body: "기준에 맞는 인수 대상을 검토합니다." },
  { label: "후보 검토", body: "전략적 적합도와 리스크를 비교합니다." },
  { label: "NDA(비밀유지계약)", body: "정보 열람을 위한 비밀유지 조건을 확정합니다." },
  { label: "IM / CIM 검토", body: "공유받은 상세 자료를 분석합니다." },
  { label: "경영진 미팅(MM)", body: "대상 회사 경영진과 직접 확인합니다." },
  { label: "IOI / LOI(인수의향서)", body: "가격·구조 등 인수 의향을 제시합니다." },
  { label: "실사(DD)", body: "회사를 상세히 검증합니다." },
  { label: "협상", body: "가격·조건·구조를 조율합니다." },
  { label: "SPA(주식매매계약)", body: "최종 조건을 확정해 계약을 체결합니다." },
  { label: "Closing(거래종결)", body: "대금 지급과 이전으로 거래를 마무리합니다." },
];

const PROBLEMS: string[] = [
  "정보가 여러 문서·이메일·메신저에 분산되어 관리가 어렵습니다.",
  "초기 검토와 자료 정리에 많은 수작업이 필요합니다.",
  "Seller와 Buyer 사이의 정보공개 시점을 세심하게 관리해야 합니다.",
  "가치평가에 필요한 재무 자료를 정리하는 부담이 큽니다.",
  "NDA 이후 접근 권한과 열람 범위를 관리해야 합니다.",
  "전문가가 언제, 어디까지 개입하는지 범위가 불명확합니다.",
  "Deal 진행상태가 담당자 개인의 기억에만 남기 쉽습니다.",
  "반복적인 문서 작성과 자료 버전 관리 부담이 있습니다.",
  "실사·Closing 체크리스트가 여러 곳에 흩어져 있습니다.",
];

type ServiceArea = { tag: string; title: string; items: string[] };

const SERVICE_AREAS: ServiceArea[] = [
  {
    tag: "A",
    title: "Seller Service",
    items: [
      "Seller Discovery로 매각 목표와 회사 정보를 정리",
      "회사정보·재무정보(Financial Information) 구조화",
      "예비 기업가치 LEVEL 0 / LEVEL 1 확인 — 현재 제공",
      "Teaser 준비, Buyer 검토, 정보공개 승인, Deal Room — 단계적 구축",
    ],
  },
  {
    tag: "B",
    title: "Buyer Service",
    items: [
      "Acquisition Criteria(인수기준)와 투자전략 구조화 — 현재 제공",
      "Buyer 워크스페이스에서 조건을 정리",
      "Target 검토, 후보 비교, Deal 진행관리 — 단계적 구축",
      "전략적 적합도 기반 Buyer Matching — 향후 Workflow",
    ],
  },
  {
    tag: "C",
    title: "AI M&A Assistant · TOM(AI)",
    items: [
      "사용자 의도 파악과 한 번에 1~3개 질문으로 정보 수집",
      "정보 구조화와 누락정보 확인",
      "다음 행동 추천과 문서 초안 보조",
      "Financial Engine 결과를 설명 — 숫자를 임의로 만들지 않음",
    ],
  },
  {
    tag: "D",
    title: "Valuation(기업가치 예비평가)",
    items: [
      "LEVEL 0: EV/Sales(매출 배수) — 현재 제공",
      "LEVEL 1: EV/EBITDA(이익 배수) — 현재 제공",
      "Financial Normalization(재무 정규화)과 Approved Benchmark(승인 비교배수)",
      "결정론적 엔진으로 Indicative Range(참고 범위)만 표시 — DCF·WACC는 사용하지 않음",
    ],
  },
  {
    tag: "E",
    title: "Deal Workflow",
    items: [
      "Teaser → NDA → IM/CIM → 경영진 미팅 → IOI/LOI",
      "실사(DD) → SPA → Closing",
      "플랫폼이 지향하는 전체 업무 흐름 — 단계적 구축",
      "가짜 거래 상태나 문서를 만들지 않음",
    ],
  },
  {
    tag: "F",
    title: "VDR · Confidentiality",
    items: [
      "회사 범위의 Private Storage와 서명 URL(signed URL) — 현재 제공",
      "권한 기반 열람·다운로드 통제와 감사 기록(Audit)",
      "Buyer 상호 격리(Buyer isolation)",
      "가상 데이터룸(VDR) 문서 열람 흐름 — 단계적 구축",
    ],
  },
  {
    tag: "G",
    title: "Expert · Advisor",
    items: [
      "회계·세무·법무·기술·산업 전문가가 배정 Deal에 참여",
      "Valuation Benchmark 승인 입력 — 현재 제공(배정 범위 한정)",
      "실사(DD)·협상·Closing 지원 — 단계적 구축",
      "필요한 시점에 참여하는 Advisor on Demand",
    ],
  },
];

const AI_PIPELINE: string[] = [
  "Understand(이해)",
  "Analyze(분석)",
  "Recommend(추천)",
  "Draft(초안)",
  "Ask Approval(승인 요청)",
  "Execute(실행)",
  "Record(기록)",
];

const AI_DOES: string[] = [
  "사용자 의도 파악과 Seller/Buyer 정보 구조화",
  "누락정보 질문과 Acquisition Criteria 정리",
  "재무정보 정규화 보조와 문서 초안 작성",
  "Deal 진행상태 안내와 다음 단계·체크리스트 추천",
  "사용자 승인 이후에만 실행하고 기록",
];

const AI_DOESNT: string[] = [
  "기업가치·EBITDA·Multiple·WACC를 임의로 생성하지 않습니다.",
  "거래 체결 여부나 Buyer 관심도를 추정하지 않습니다.",
  "계약 체결이나 자금 확보를 사실처럼 간주하지 않습니다.",
  "중요한 숫자·상태는 Financial Engine, 실제 입력, 승인 이벤트, Deal Event를 Source of Truth로 사용합니다.",
];

const USER_TYPES: string[] = [
  "기업매각 Seller",
  "기업인수 Buyer",
  "M&A Advisor",
  "회계사",
  "세무사",
  "변호사",
  "기술전문가",
  "산업전문가",
  "Platform Internal",
];

const PRINCIPLES: ServiceArea[] = [
  {
    tag: "01",
    title: "AI First · Direct Communication",
    items: [
      "AI가 먼저 정리하고, Seller와 Buyer가 플랫폼 안에서 직접 진행",
      "모든 대화를 중개자가 대신하는 구조가 아님",
    ],
  },
  {
    tag: "02",
    title: "Advisor On Demand · Expert When Needed",
    items: [
      "필요한 시점에 M&A Advisor·회계사·변호사·세무사·기술전문가가 참여",
      "전문가 개입은 실패가 아니라 정상 경로",
    ],
  },
  {
    tag: "03",
    title: "Permission by Design · Human-in-the-loop",
    items: [
      "권한은 서버와 DB가 강제하고, 민감한 실행은 사람이 승인",
      "Deal·Role·Permission 기반으로 접근을 통제",
    ],
  },
];

type FlowStep = { label: string; note: string };

const USAGE_FLOW: FlowStep[] = [
  { label: "회원가입", note: "현재 제공" },
  { label: "이용 목적 선택", note: "현재 제공" },
  { label: "회사 등록 / 연결", note: "현재 제공" },
  { label: "역할 워크스페이스", note: "현재 제공" },
  { label: "TOM(AI) 상담", note: "현재 제공" },
  { label: "정보 입력", note: "현재 제공" },
  { label: "분석", note: "현재 제공" },
  { label: "Valuation / Acquisition Criteria", note: "현재 제공" },
  { label: "Deal 준비", note: "단계적 구축" },
  { label: "정보공개 승인", note: "단계적 구축" },
  { label: "상대방 검토", note: "단계적 구축" },
  { label: "전문가 참여", note: "단계적 구축" },
  { label: "Deal 진행", note: "단계적 구축" },
  { label: "Closing", note: "단계적 구축" },
];

const SECURITY: ServiceArea[] = [
  {
    tag: "01",
    title: "Deal · Company 기반 접근",
    items: [
      "접근 권한은 Deal과 회사 범위로 제한됩니다.",
      "서버 CurrentContext가 Source of Truth이며 클라이언트 값을 신뢰하지 않습니다.",
    ],
  },
  {
    tag: "02",
    title: "Buyer 격리 · Expert Scoped Access",
    items: [
      "Buyer는 서로의 존재·정보를 볼 수 없습니다.",
      "전문가는 배정된 Deal의 권한 범위만 접근합니다.",
    ],
  },
  {
    tag: "03",
    title: "승인 기반 정보공개",
    items: [
      "NDA 체결이 모든 정보의 자동 공개를 의미하지 않습니다.",
      "회사 신원·IM 공개는 Seller의 별도 승인에 따라 범위를 관리합니다.",
    ],
  },
];

const CURRENT_FEATURES: string[] = [
  "회원가입·로그인, 이용목적 선택, 회사 연결/등록",
  "Seller/Buyer/Expert 역할 워크스페이스",
  "TOM(AI) 상담과 정보 입력(계정 저장)",
  "재무정보 입력·정규화",
  "예비 기업가치 LEVEL 0(EV/Sales)·LEVEL 1(EV/EBITDA)",
  "Buyer 인수기준(Acquisition Criteria) 수집·정규화",
  "회사 범위 Private Storage와 서명 URL",
  "전문가·내부의 승인 비교배수 입력(배정 범위 한정)",
];

const UPCOMING_FEATURES: string[] = [
  "Teaser, NDA, IM/CIM 문서 흐름",
  "Buyer Matching·후보 검토·Opportunity",
  "경영진 미팅(MM)·IOI/LOI 실행 흐름",
  "실사(DD) Workstream·SPA·Closing",
  "가상 데이터룸(VDR) 문서 열람",
  "전문가 중개자문 요청과 실제 LLM 모델 연동",
];

function TraditionalVsVericom() {
  const rows: { aspect: string; traditional: string; vericom: string }[] = [
    {
      aspect: "진행 방식",
      traditional: "사람·이메일·문서 중심의 수동 진행",
      vericom: "AI 보조와 워크플로우 기반 진행",
    },
    {
      aspect: "정보 관리",
      traditional: "여러 채널에 분산, 수동 Follow-up",
      vericom: "구조화 데이터와 Deal Context로 연결",
    },
    {
      aspect: "권한·기밀",
      traditional: "관행에 의존",
      vericom: "Permission 기반과 사람 승인",
    },
    {
      aspect: "전문가 참여",
      traditional: "처음부터 전면 위임이 일반적",
      vericom: "필요한 시점에 효율적으로 참여",
    },
  ];
  return (
    <div className="mt-8 overflow-hidden rounded-xl border border-line sm:mt-10">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-navy text-white">
            <th className="px-4 py-3 font-semibold sm:px-6">구분</th>
            <th className="px-4 py-3 font-semibold sm:px-6">전통적 방식</th>
            <th className="px-4 py-3 font-semibold sm:px-6">VERICOM</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.aspect} className="border-t border-line bg-white">
              <th
                scope="row"
                className="px-4 py-4 align-top font-semibold text-foreground sm:px-6"
              >
                {row.aspect}
              </th>
              <td className="px-4 py-4 align-top text-muted sm:px-6">
                {row.traditional}
              </td>
              <td className="px-4 py-4 align-top text-foreground sm:px-6">
                {row.vericom}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkflowVisual() {
  const stages = [
    "Seller",
    "TOM(AI)",
    "Discovery",
    "Financial / Valuation",
    "Teaser",
    "Buyer",
    "NDA",
    "IM / CIM",
    "경영진 미팅",
    "IOI / LOI",
    "실사(DD)",
    "SPA",
    "Closing",
  ];
  return (
    <ol className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-3 sm:mt-10">
      {stages.map((stage, index) => (
        <li key={stage} className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            {stage}
          </span>
          {index < stages.length - 1 ? (
            <span aria-hidden="true" className="text-navy">
              →
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function FlowColumn({ title, stages }: { title: string; stages: Stage[] }) {
  return (
    <div className="rounded-xl border border-line bg-white p-6 sm:p-7">
      <h3 className="text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      <ol className="mt-5 space-y-4">
        {stages.map((stage, index) => (
          <li key={stage.label} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/5 font-mono text-[11px] text-navy">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div>
              <p className="break-keep text-sm font-semibold text-foreground">
                {stage.label}
              </p>
              <p className="mt-1 break-keep text-sm leading-6 text-muted">
                {stage.body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function ServiceOverviewView({ signedIn }: { signedIn: boolean }) {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className={`${container} py-16 sm:py-20 lg:py-24`}>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-navy">
            서비스 소개
          </p>
          <h1 className="mt-4 max-w-3xl break-keep text-3xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-4xl lg:text-[2.9rem] lg:leading-[1.14]">
            M&amp;A 거래의 전 과정을 AI와 워크플로우로 연결하는 M&amp;A 운영 플랫폼
          </h1>
          <p className="mt-5 max-w-2xl break-keep text-lg leading-8 text-foreground sm:text-xl">
            베리컴(VERICOM)은 M&amp;A(인수합병) 거래의 탐색·분석·준비·검토·협상·실사·클로징까지의
            과정을 AI와 디지털 워크플로우로 연결하는 AI 기반 M&amp;A 운영 플랫폼입니다.
          </p>
          <p className={leadClass}>
            Seller와 Buyer가 플랫폼 안에서 직접 진행하고, 필요한 시점에 전문가가 참여합니다.
            TOM(AI)이 거래를 안내하며, 중요한 결정은 사람이 승인합니다.
          </p>
          <div className="mt-2">
            <StartConsultButtons signedIn={signedIn} />
          </div>
        </div>
      </section>

      {/* M&A 업무란 무엇인가 */}
      <section className="border-b border-line bg-surface-subtle">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>M&amp;A 업무란 무엇인가</h2>
          <p className={leadClass}>
            M&amp;A는 회사를 팔거나 사는 거래로, 일반적으로 준비부터 거래종결(Closing)까지
            여러 단계를 거칩니다. 매각(Seller)과 인수(Buyer)의 관점에서 흐름은 다음과 같습니다.
          </p>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-2">
            <FlowColumn title="Seller 측 (기업 매각)" stages={SELLER_FLOW} />
            <FlowColumn title="Buyer 측 (기업 인수)" stages={BUYER_FLOW} />
          </div>
        </div>
      </section>

      {/* VERICOM이 해결하는 문제 */}
      <section className="border-b border-line bg-white">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>VERICOM이 해결하는 문제</h2>
          <p className={leadClass}>
            전통적인 M&amp;A 진행 과정에서는 정보와 절차가 여러 곳에 흩어지기 쉽습니다.
            베리컴은 이 과정을 하나의 플랫폼 워크플로우로 연결합니다.
          </p>
          <ul className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
            {PROBLEMS.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-line bg-white px-5 py-4 text-[15px] leading-7 text-muted break-keep"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 핵심 서비스 영역 */}
      <section className="border-b border-line bg-surface-subtle">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>핵심 서비스 영역</h2>
          <p className={leadClass}>
            베리컴은 매각·인수 당사자와 전문가가 각자의 역할에서 사용할 수 있는
            서비스 영역을 제공합니다.
          </p>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {SERVICE_AREAS.map((area) => (
              <div
                key={area.tag}
                className="flex h-full flex-col rounded-xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <span className="font-mono text-[11px] tracking-wider text-navy">
                  {area.tag}
                </span>
                <h3 className="mt-2.5 break-keep text-base font-semibold tracking-tight text-foreground">
                  {area.title}
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                  {area.items.map((item) => (
                    <li key={item} className="break-keep">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI가 하는 일 */}
      <section className="border-b border-line bg-white">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>AI가 하는 일</h2>
          <p className={leadClass}>
            베리컴의 AI는 다음 순서를 지키며, 중요한 실행은 사용자의 승인 이후에만
            진행합니다.
          </p>
          <ol className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-3">
            {AI_PIPELINE.map((step, index) => (
              <li key={step} className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-foreground">
                  {step}
                </span>
                {index < AI_PIPELINE.length - 1 ? (
                  <span aria-hidden="true" className="text-navy">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
          <ul className="mt-8 grid max-w-3xl list-disc gap-2.5 pl-5 text-[15px] leading-7 text-muted">
            {AI_DOES.map((item) => (
              <li key={item} className="break-keep">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AI가 하지 않는 일 */}
      <section className="border-b border-line bg-surface-subtle">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>AI가 하지 않는 일</h2>
          <p className={leadClass}>
            신뢰성을 위해 AI의 한계를 분명히 합니다. 중요한 숫자와 상태는 검증된
            출처에서만 나옵니다.
          </p>
          <ul className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4">
            {AI_DOESNT.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-line bg-white px-5 py-4 text-[15px] leading-7 text-muted break-keep"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 사용자 유형 */}
      <section className="border-b border-line bg-white">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>사용자 유형</h2>
          <p className={leadClass}>
            베리컴에는 다양한 역할의 사용자가 참여합니다. 모두가 같은 정보에 접근하는
            구조가 아니라 Deal·Role·Permission(권한)에 따라 접근이 제한됩니다.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2.5 sm:mt-10">
            {USER_TYPES.map((item) => (
              <li
                key={item}
                className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Direct + Advisory Model */}
      <section className="border-b border-line bg-surface-subtle">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>직접 진행과 전문가 지원의 결합</h2>
          <p className={leadClass}>
            베리컴은 중개자가 모든 연락을 대신하는 방식만을 지향하지 않습니다.
            AI First, Direct Communication, Advisor On Demand, Expert When Needed,
            Permission by Design, Human-in-the-loop를 기본 구조로 합니다.
          </p>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div
                key={p.tag}
                className="flex h-full flex-col rounded-xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <span className="font-mono text-[11px] tracking-wider text-navy">
                  {p.tag}
                </span>
                <h3 className="mt-2.5 break-keep text-base font-semibold tracking-tight text-foreground">
                  {p.title}
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                  {p.items.map((item) => (
                    <li key={item} className="break-keep">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 서비스 이용 방식 */}
      <section className="border-b border-line bg-white">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>서비스 이용 방식</h2>
          <p className={leadClass}>
            전체 이용 흐름입니다. 현재 제공하는 기능과 단계적으로 구축하는 워크플로우를
            구분해 표시했습니다.
          </p>
          <ol className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {USAGE_FLOW.map((step, index) => (
              <li
                key={step.label}
                className="flex items-start gap-3 rounded-xl border border-line bg-white px-5 py-4"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy/5 font-mono text-[11px] text-navy">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="break-keep text-sm font-semibold text-foreground">
                    {step.label}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted">
                    {step.note}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 보안과 기밀성 */}
      <section className="border-b border-line bg-surface-subtle">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>보안과 기밀성</h2>
          <p className={leadClass}>
            M&amp;A에서 기밀성은 핵심입니다. 베리컴은 접근을 Deal과 권한 기반으로
            통제하고, 정보공개는 승인에 따라 관리합니다.
          </p>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-3">
            {SECURITY.map((s) => (
              <div
                key={s.tag}
                className="flex h-full flex-col rounded-xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <span className="font-mono text-[11px] tracking-wider text-navy">
                  {s.tag}
                </span>
                <h3 className="mt-2.5 break-keep text-base font-semibold tracking-tight text-foreground">
                  {s.title}
                </h3>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                  {s.items.map((item) => (
                    <li key={item} className="break-keep">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VERICOM의 차별점 */}
      <section className="border-b border-line bg-white">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>VERICOM의 차별점</h2>
          <p className={leadClass}>
            베리컴은 전문가를 대체하려는 것이 아니라, 전문가가 필요한 시점에 더
            효율적으로 참여하도록 돕는 것을 지향합니다.
          </p>
          <TraditionalVsVericom />
        </div>
      </section>

      {/* 전체 M&A Workflow */}
      <section className="border-b border-line bg-surface-subtle">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>전체 M&amp;A Workflow</h2>
          <p className={leadClass}>
            베리컴이 지향하는 전체 M&amp;A 업무 흐름입니다. 정보 이해를 돕기 위한
            시각화이며, 일부 단계는 단계적으로 구축됩니다.
          </p>
          <WorkflowVisual />
        </div>
      </section>

      {/* 현재 제공 / 단계적 구축 */}
      <section className="border-b border-line bg-white">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>현재 제공 · 단계적 구축</h2>
          <p className={leadClass}>
            현재 이용할 수 있는 기능과 앞으로 구축하는 워크플로우를 구분합니다.
            준비 중인 기능을 완성된 것처럼 표시하지 않습니다.
          </p>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
            <div className="rounded-xl border border-line bg-white p-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                현재 제공
              </h3>
              <ul className="mt-4 list-disc space-y-2.5 pl-5 text-[15px] leading-7 text-muted">
                {CURRENT_FEATURES.map((item) => (
                  <li key={item} className="break-keep">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-white p-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                단계적 구축
              </h3>
              <ul className="mt-4 list-disc space-y-2.5 pl-5 text-[15px] leading-7 text-muted">
                {UPCOMING_FEATURES.map((item) => (
                  <li key={item} className="break-keep">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 최종 CTA */}
      <section className="bg-white">
        <div className={`${container} ${sectionPad}`}>
          <div className="rounded-2xl border border-line bg-navy px-6 py-10 text-center sm:px-10 sm:py-14">
            <h2 className="break-keep text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              지금 시작해 보세요
            </h2>
            <p className="mx-auto mt-4 max-w-2xl break-keep text-[15px] leading-7 text-white/80 sm:text-base sm:leading-8">
              회원가입 후 이용목적을 선택하고 회사를 연결하면, 역할에 맞는 워크스페이스와
              TOM(AI) 상담을 바로 이용할 수 있습니다.
            </p>
            <div className="mt-8 flex justify-center">
              <StartConsultButtons signedIn={signedIn} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
