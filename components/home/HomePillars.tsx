import Link from "next/link";
import {
  LANDING_BUY_HREF,
  LANDING_SELL_HREF,
  LANDING_TOM_HREF,
} from "@/lib/landing/service-pages";

const pillars = [
  {
    id: "sell",
    kicker: "SELL",
    title: "기업 매각",
    copy: "매각 준비부터 가치평가, 티저, 거래 실행까지 Seller Workspace에서 진행합니다.",
    href: LANDING_SELL_HREF,
  },
  {
    id: "buy",
    kicker: "BUY",
    title: "기업 인수",
    copy: "인수조건을 정리하고 후보를 검토합니다. 신원 자동 공개와 가짜 추천은 하지 않습니다.",
    href: LANDING_BUY_HREF,
  },
  {
    id: "tom",
    kicker: "TOM",
    title: "AI Deal Agent",
    copy: "Deal Context를 이해하고 다음 행동을 제안합니다. 중요한 결정은 사람이 승인합니다.",
    href: LANDING_TOM_HREF,
  },
] as const;

export function HomePillars() {
  return (
    <section id="service" className="border-b border-[#E4E7EC] bg-[#F7F8FA]">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-[7.5rem]">
        <h2 className="max-w-3xl text-[1.75rem] font-semibold leading-tight tracking-tight text-[#101828] sm:text-[2.25rem] sm:leading-[1.2]">
          하나의 플랫폼에서 M&amp;A를 시작하고, 분석하고, 실행합니다.
        </h2>
        <div className="mt-14 grid gap-10 border-t border-[#E4E7EC] pt-10 md:grid-cols-3 md:gap-12">
          {pillars.map((item) => (
            <div id={item.id} key={item.id}>
              <p className="text-[11px] font-medium tracking-[0.18em] text-navy">{item.kicker}</p>
              <h3 className="mt-3 text-xl font-semibold text-[#101828]">{item.title}</h3>
              <p className="mt-3 max-w-sm text-[16px] leading-7 text-[#475467]">{item.copy}</p>
              <Link
                href={item.href}
                className="mt-5 inline-flex text-sm font-medium text-navy underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
              >
                자세히 보기
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
