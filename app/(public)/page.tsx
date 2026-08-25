import { BrandLogo } from "@/components/layout/BrandLogo";
import { Header } from "@/components/layout/Header";
import { StartConsultButtons } from "@/components/landing/StartConsultButtons";
import { TomIntro } from "@/components/tom/TomIntro";
import { MACRO_MA_PROCESS } from "@/lib/deal/macro-process";
import { getCurrentContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const valueCards = [
  {
    title: "기업가치 예비평가",
    copy: "몇 가지 핵심 정보를 바탕으로 가치 범위를 빠르게 확인",
  },
  {
    title: "인수후보 Top3",
    copy: "전략적 적합도 기반 Buyer 후보 탐색",
  },
  {
    title: "기밀 거래관리",
    copy: "승인 기반 정보공개와 단계별 권한통제",
  },
  {
    title: "전문가 협업",
    copy: "회계·법률·세무·산업 전문가와 DD(실사) 협업",
  },
];

export default async function Home() {
  const context = await getCurrentContext();
  const signedIn = Boolean(context);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-foreground">
      <a
        href="#top"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-white"
      >
        본문으로 건너뛰기
      </a>
      <Header signedIn={signedIn} />

      <main id="top">
        <section className="bg-[#FFFFFF]">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-16 lg:pb-28 lg:pt-20">
            <div className="max-w-xl lg:max-w-none">
              <p className="text-[11px] font-medium tracking-[0.22em] text-navy sm:text-xs">
                VERICOM
              </p>
              <p className="mt-1.5 text-sm text-navy">M&amp;A, Your Way</p>
              <h1 className="mt-5 text-[1.7rem] font-semibold leading-[1.28] tracking-tight text-foreground sm:mt-7 sm:text-4xl lg:text-[2.65rem] lg:leading-[1.22]">
                AI와 M&amp;A 전문가가 함께하는 기밀형 기업 인수합병 플랫폼
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-7 text-muted sm:mt-6 sm:text-base sm:leading-7">
                기업가치 예비평가부터 인수후보 탐색, 비밀유지계약, 투자설명서,
                Q&amp;A, 경영진 미팅까지 거래의 다음 단계를 TOM이 안내합니다.
              </p>
              <p className="mt-3 text-xs leading-5 text-muted">
                TODO: 브랜드팀 확정 문구가 생기면 이 카피를 교체합니다.
              </p>
              <StartConsultButtons signedIn={signedIn} />
            </div>
            <TomIntro />
          </div>
        </section>

        <section
          id="service"
          className="border-t border-line bg-[#FFFFFF]"
        >
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              서비스 소개
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
              베리컴은 Seller, Buyer, Expert가 각자의 워크스페이스에서 활동하고,
              Deal과 Opportunity를 중심으로 연결됩니다. TOM이 거래를 이끌고,
              사람이 중요한 결정을 승인하며, 전문가가 전문판단을 검증합니다.
            </p>
            <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4">
              {valueCards.map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-line bg-white px-5 py-6 sm:p-8"
                >
                  <p className="font-mono text-[11px] text-navy">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted">
                    {item.copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="journey" className="border-t border-line bg-[#FFFFFF]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              거래 진행 흐름
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
              베리컴 표준 M&amp;A 10단계입니다. NDA는 비밀유지계약, CIM/IM은
              투자설명서, LOI는 인수의향서, DD는 실사, SPA는 주식매매계약,
              PMI는 인수 후 통합입니다.
            </p>
            <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {MACRO_MA_PROCESS.map((step) => (
                <li
                  key={step.id}
                  className="rounded-xl border border-line bg-white px-5 py-5"
                >
                  <span className="font-mono text-[11px] text-navy">
                    {String(step.order).padStart(2, "0")}
                  </span>
                  <p className="mt-2.5 text-sm leading-6 text-foreground">
                    {step.label}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="sell" className="border-t border-line bg-[#FFFFFF]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              기업 매각
            </h2>
            <p className="mt-3 text-lg tracking-tight text-foreground">
              우리 회사 지금 얼마일까요?
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
              계정 연결 후 TOM과 매각 상담을 시작합니다. 실제 Buyer 접촉 전에는
              회사·권한 확인이 필요합니다.
            </p>
          </div>
        </section>

        <section id="buy" className="border-t border-line bg-[#FFFFFF]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              기업 인수
            </h2>
            <p className="mt-3 text-lg tracking-tight text-foreground">
              어떤 회사를 찾고 계신가요?
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
              계정 연결 후 인수 조건을 상담합니다. 관심 표시는 Seller 신원 자동
              공개를 의미하지 않으며, NDA(비밀유지계약) 완료만으로 회사명이나
              IM(투자설명서)이 공개되지 않습니다.
            </p>
          </div>
        </section>

        <section id="expert" className="border-t border-line bg-[#FFFFFF]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              전문가
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
              FDD / LDD / Tax DD / CDD 등 전문 업무를 배정 Deal의 Workstream
              범위 안에서만 수행합니다. 이해상충·비밀유지 절차가 끝나기 전에는
              문서에 접근할 수 없습니다.
            </p>
          </div>
        </section>

        <section id="guide" className="border-t border-line bg-[#FFFFFF]">
          <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              이용안내
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
              랜딩 → 회원가입 또는 로그인 → 이용목적 선택 → 회사 연결 또는
              신규등록 → 역할 워크스페이스 → TOM 상담. 초기 시장은
              Seller-first이며, MVP는 Management Meeting까지입니다.
            </p>
            <p className="mt-6 text-sm leading-6 text-muted">
              TODO: 회사·권한 Verification, TOM 실제 모델 연동, Teaser·NDA·IM
              문서 연결은 후속 단계입니다.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-[#FFFFFF] px-5 py-12 text-sm text-muted sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="bg-[#FFFFFF]">
            <BrandLogo className="h-11 sm:h-12" />
          </div>
          <div className="max-w-md space-y-1.5 leading-6">
            <p className="text-foreground">베리컴 · M&amp;A, Your Way</p>
            <p>TODO: 공식 법인명</p>
            <p>TODO: 본사 주소</p>
            <p>TODO: 대표 이메일 · 전화번호</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
