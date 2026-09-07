import { StartConsultButtons } from "@/components/landing/StartConsultButtons";

const container = "mx-auto w-full max-w-[1200px] px-6 sm:px-8 lg:px-10";
const sectionPad = "py-16 sm:py-20 lg:py-24";
const h2Class =
  "break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[2rem] sm:leading-[1.2]";
const leadClass =
  "mt-4 max-w-2xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8";

function AccentBar() {
  return (
    <span aria-hidden="true" className="mb-5 block h-1 w-10 rounded-full bg-navy" />
  );
}

/* ── VERICOM이 하는 일 ─────────────────────────── */
type Area = { title: string; body: string; note: string };
const AREAS: Area[] = [
  {
    title: "거래 준비",
    body: "Seller Discovery와 Buyer Criteria로 목표를 정리하고, 회사·재무정보를 구조화합니다.",
    note: "현재 제공",
  },
  {
    title: "가치평가",
    body: "승인된 비교배수(Approved Benchmark)를 기준으로 LEVEL 0(EV/Sales)·LEVEL 1(EV/EBITDA) 예비 범위를 확인합니다.",
    note: "현재 제공",
  },
  {
    title: "거래 진행",
    body: "Teaser·NDA·IM/CIM·경영진 미팅·LOI·실사(DD)·SPA·Closing으로 이어지는 거래 흐름을 하나의 워크플로우로 연결합니다.",
    note: "단계적 구축",
  },
  {
    title: "전문가 협업",
    body: "필요한 시점에 M&A Advisor와 회계·세무·법무·기술 전문가가 배정 Deal에 참여합니다.",
    note: "단계적 구축",
  },
];

/* ── AI가 지원하는 업무 ────────────────────────── */
const AI_DOES: string[] = [
  "사용자 의도 파악과 정보 구조화",
  "누락정보 확인과 거래 준비 지원",
  "문서 초안과 다음 단계 안내",
  "Financial Engine 결과 설명",
];

/* ── Seller / Buyer / Expert ───────────────────── */
type Role = { title: string; items: string[] };
const ROLES: Role[] = [
  {
    title: "Seller",
    items: [
      "기업매각 준비와 재무정보 정리",
      "예비 가치평가(Valuation) 확인",
      "정보공개 승인과 Deal 진행",
    ],
  },
  {
    title: "Buyer",
    items: [
      "인수조건(Acquisition Criteria) 설정",
      "후보 검토와 NDA 이후 자료 검토",
      "IOI/LOI 제시와 실사(DD)",
    ],
  },
  {
    title: "Expert / Advisor",
    items: [
      "Deal별 초대와 권한 범위 내 참여",
      "회계·세무·법무·기술·협상 지원",
      "필요 시 Mandate 계약 후 공식 자문",
    ],
  },
];

/* ── Direct + Advisory ─────────────────────────── */
const MODES: { title: string; body: string }[] = [
  { title: "Self-Service", body: "Mandate 없이 플랫폼에서 직접 진행" },
  { title: "AI-Assisted", body: "TOM(AI)이 준비·분석·초안을 지원" },
  { title: "Advisor-Assisted", body: "Mandate 계약 후 M&A Advisor가 공식 지원" },
  { title: "Expert-Assisted", body: "회계·세무·법무·기술 전문가가 범위 내 참여" },
];

/* ── Security ──────────────────────────────────── */
const SECURITY: string[] = [
  "Deal · Company 기반 접근",
  "Buyer 상호 격리(Buyer isolation)",
  "Expert 배정 범위 한정 접근",
  "Private Storage · VDR · 서명 URL",
  "감사 기록(Audit)",
  "NDA Gate와 Seller 승인 기반 정보공개",
];

export function ServiceOverviewView({ signedIn }: { signedIn: boolean }) {
  return (
    <main className="bg-white">
      {/* 1. Hero */}
      <section className="border-b border-line bg-white">
        <div className={`${container} py-16 sm:py-20 lg:py-24`}>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-navy">
            서비스 소개
          </p>
          <h1 className="mt-4 max-w-3xl break-keep text-3xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-4xl lg:text-[2.9rem] lg:leading-[1.14]">
            기업 매각·인수의 전 과정을 AI와 워크플로우로 관리하는 M&amp;A 플랫폼
          </h1>
          <p className="mt-5 max-w-2xl break-keep text-lg leading-8 text-foreground sm:text-xl">
            베리컴(VERICOM)은 M&amp;A(인수합병) 거래의 준비부터 클로징까지를
            AI와 디지털 워크플로우로 연결합니다. 당사자가 직접 진행하고, 필요한
            시점에 전문가가 참여합니다.
          </p>
          <div className="mt-2">
            <StartConsultButtons signedIn={signedIn} />
          </div>
        </div>
      </section>

      {/* 2. VERICOM이 하는 일 */}
      <section className="border-b border-line bg-surface-subtle">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>VERICOM이 하는 일</h2>
          <p className={leadClass}>
            베리컴은 거래 준비부터 전문가 협업까지 네 영역을 하나의 플랫폼으로
            연결합니다.
          </p>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {AREAS.map((area) => (
              <div key={area.title} className="border-t border-line pt-5">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold tracking-tight text-foreground">
                    {area.title}
                  </h3>
                  <span className="rounded-full bg-navy/5 px-2.5 py-0.5 text-xs font-medium text-navy">
                    {area.note}
                  </span>
                </div>
                <p className="mt-2.5 break-keep text-[15px] leading-7 text-muted">
                  {area.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. AI가 지원하는 업무 */}
      <section className="border-b border-line bg-white">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>AI가 지원하는 업무</h2>
          <p className={leadClass}>
            TOM(AI)은 Understand → Analyze → Recommend → Draft → Ask Approval →
            Execute → Record 순서로 업무를 지원하며, 중요한 실행은 사용자의 승인
            이후에 진행합니다.
          </p>
          <ul className="mt-8 grid max-w-3xl gap-2.5 sm:grid-cols-2">
            {AI_DOES.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 break-keep text-[15px] leading-7 text-muted"
              >
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-3xl break-keep text-sm leading-7 text-muted">
            AI는 기업가치·EBITDA·Multiple·WACC·거래 체결·Buyer 관심도를 임의로
            생성하지 않습니다. 중요한 숫자와 상태는 Financial Engine, 실제 입력,
            승인 이벤트를 Source of Truth로 사용합니다.
          </p>
        </div>
      </section>

      {/* 4. Seller / Buyer / Expert */}
      <section className="border-b border-line bg-surface-subtle">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>Seller / Buyer / Expert</h2>
          <p className={leadClass}>
            역할에 따라 사용하는 기능이 다르며, 접근은 Deal·Role·Permission을
            기준으로 제한됩니다.
          </p>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-3">
            {ROLES.map((role) => (
              <div key={role.title} className="border-t border-line pt-5">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {role.title}
                </h3>
                <ul className="mt-3 space-y-2 text-[15px] leading-7 text-muted">
                  {role.items.map((item) => (
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

      {/* 5. Direct + Advisory */}
      <section className="border-b border-line bg-white">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>직접 진행 + 전문가 지원</h2>
          <p className={leadClass}>
            사용자는 플랫폼에서 직접 진행하고, 필요할 때 Advisor 또는 Expert를
            Deal에 참여시킬 수 있습니다. Advisor가 공식적으로 M&amp;A 업무를
            수행할 때는 Mandate 계약으로 역할과 보수 범위를 정합니다.
          </p>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {MODES.map((mode) => (
              <div key={mode.title} className="border-t border-line pt-5">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  {mode.title}
                </h3>
                <p className="mt-2 break-keep text-sm leading-6 text-muted">
                  {mode.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Security / CTA */}
      <section className="bg-surface-subtle">
        <div className={`${container} ${sectionPad}`}>
          <AccentBar />
          <h2 className={h2Class}>보안과 기밀성</h2>
          <p className={leadClass}>
            접근은 Deal과 권한 기반으로 통제됩니다. NDA 체결이 전체 정보의 자동
            공개를 의미하지 않으며, 회사 신원·IM 공개는 Seller 승인에 따라 범위를
            관리합니다.
          </p>
          <ul className="mt-8 flex flex-wrap gap-2.5">
            {SECURITY.map((item) => (
              <li
                key={item}
                className="rounded-md border border-line bg-white px-4 py-2 text-sm font-medium text-foreground break-keep"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-14 rounded-2xl border border-line bg-navy px-6 py-10 text-center sm:px-10 sm:py-12">
            <h3 className="break-keep text-2xl font-semibold tracking-tight text-white sm:text-[1.7rem]">
              지금 시작해 보세요
            </h3>
            <p className="mx-auto mt-3 max-w-2xl break-keep text-[15px] leading-7 text-white/80 sm:text-base">
              회원가입 후 이용목적을 선택하고 회사를 연결하면, 역할에 맞는
              워크스페이스와 TOM(AI) 상담을 바로 이용할 수 있습니다.
            </p>
            <div className="mt-6 flex justify-center">
              <StartConsultButtons signedIn={signedIn} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
