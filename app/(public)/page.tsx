import Link from "next/link";
import { StartConsultButtons } from "@/components/landing/StartConsultButtons";
import { TomIntro } from "@/components/tom/TomIntro";
import {
  LANDING_BUY_HREF,
  LANDING_EXPERT_HREF,
  LANDING_GUIDE_HREF,
  LANDING_SELL_HREF,
  LANDING_VALUE_CARDS,
} from "@/lib/landing/service-pages";
import { MACRO_MA_PROCESS } from "@/lib/deal/macro-process";
import { journeyProcessHref } from "@/lib/landing/journey-pages";
import { getCurrentContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const titleLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

export default async function Home() {
  const context = await getCurrentContext();
  const signedIn = Boolean(context);

  return (
    <main>
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
              Q&amp;A, 경영진 미팅까지 거래의 다음 단계를 TOM(AI)이 안내합니다.
            </p>
            <p className="mt-3 text-xs leading-5 text-muted">
              TODO: 브랜드팀 확정 문구가 생기면 이 카피를 교체합니다.
            </p>
            <StartConsultButtons signedIn={signedIn} />
          </div>
          <TomIntro signedIn={signedIn} />
        </div>
      </section>

      <section id="service" className="border-t border-line bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            서비스 소개
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
            베리컴은 Seller, Buyer, Expert가 각자의 워크스페이스에서 활동하고,
            Deal과 Opportunity를 중심으로 연결됩니다. TOM(AI)이 거래를 이끌고,
            사람이 중요한 결정을 승인하며, 전문가가 전문판단을 검증합니다.
          </p>
          <div className="mt-10 grid gap-3 sm:mt-12 sm:grid-cols-2 sm:gap-4">
            {LANDING_VALUE_CARDS.map((item, index) => (
              <Link
                key={item.slug}
                href={item.href}
                className="rounded-xl border border-line bg-white px-5 py-6 transition-colors hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:p-8"
              >
                <p className="font-mono text-[11px] text-navy">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-muted">{item.copy}</p>
                <p className="mt-4 text-sm text-navy">자세히 보기</p>
              </Link>
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
              <li key={step.id}>
                <Link
                  href={journeyProcessHref(step.id)}
                  className="block rounded-xl border border-line bg-white px-5 py-5 transition-colors hover:border-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  <span className="font-mono text-[11px] text-navy">
                    {String(step.order).padStart(2, "0")}
                  </span>
                  <p className="mt-2.5 text-sm leading-6 text-foreground">
                    {step.label}
                  </p>
                  <p className="mt-3 text-sm text-navy">자세히 보기</p>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="sell" className="border-t border-line bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            <Link href={LANDING_SELL_HREF} className={titleLinkClass}>
              기업 매각
            </Link>
          </h2>
          <p className="mt-3 text-lg tracking-tight text-foreground">
            우리 회사 지금 얼마일까요?
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
            계정 연결 후 TOM(AI)과 매각 상담을 시작합니다. 실제 Buyer 접촉 전에는
            회사·권한 확인이 필요합니다.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
            기업가치 예비평가는 로그인 후 LEVEL 0(매출)·LEVEL 1(EBITDA)로
            진행합니다. 검증된 비교배수가 있을 때만 가치 범위를 보여 주며,
            NDA(비밀유지계약)·IM(투자설명서) 공개와 Buyer Matching은 준비
            중입니다.
          </p>
        </div>
      </section>

      <section id="buy" className="border-t border-line bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            <Link href={LANDING_BUY_HREF} className={titleLinkClass}>
              기업 인수
            </Link>
          </h2>
          <p className="mt-3 text-lg tracking-tight text-foreground">
            어떤 회사를 찾고 계신가요?
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
            계정 연결 후 인수 조건을 상담합니다. 관심 표시는 Seller 신원 자동
            공개를 의미하지 않으며, NDA(비밀유지계약) 완료만으로 회사명이나
            IM(투자설명서)이 공개되지 않습니다.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
            Matching Engine은 준비 전입니다. 추천 회사나 Top3를 가짜로 보여
            주지 않으며, 로그인 후 인수조건만 정리할 수 있습니다.
          </p>
        </div>
      </section>

      <section id="expert" className="border-t border-line bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            <Link href={LANDING_EXPERT_HREF} className={titleLinkClass}>
              전문가
            </Link>
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
            FDD / LDD / Tax DD / CDD 등 전문 업무를 배정 Deal의 Workstream
            범위 안에서만 수행합니다. 이해상충·비밀유지 절차가 끝나기 전에는
            문서에 접근할 수 없습니다.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
            TOM(AI)은 전문가를 대체하지 않습니다. 로그인 후 전문가 워크스페이스에서
            배정 Deal 범위만 다루며, DD(실사) Workstream 실행은 준비 중입니다.
          </p>
        </div>
      </section>

      <section id="guide" className="border-t border-line bg-[#FFFFFF]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            <Link href={LANDING_GUIDE_HREF} className={titleLinkClass}>
              이용안내
            </Link>
          </h2>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
            랜딩 → 회원가입 또는 로그인 → 이용목적 선택 → 회사 연결 또는
            신규등록 → 역할 워크스페이스 → TOM(AI) 상담. 초기 시장은
            Seller-first이며, MVP는 Management Meeting까지입니다.
          </p>
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
            Guest 익명 상담은 하지 않습니다. 제목을 눌러 이용 순서를 확인하고
            로그인 또는 회원가입으로 이어갈 수 있습니다.
          </p>
          <p className="mt-6 text-sm leading-6 text-muted">
            TODO: 회사·권한 Verification, TOM(AI) 실제 모델 연동, Teaser·NDA·IM
            문서 연결은 후속 단계입니다.
          </p>
        </div>
      </section>
    </main>
  );
}
