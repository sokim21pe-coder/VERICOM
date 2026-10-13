import Link from "next/link";
import {
  LANDING_BUY_HREF,
  LANDING_SELL_HREF,
  LANDING_TOM_HREF,
} from "@/lib/landing/service-pages";

const pillars = [
  {
    id: "sell",
    index: "01",
    kicker: "SELL",
    title: "기업 매각",
    copy: "매각 준비부터 거래 실행까지.",
    href: LANDING_SELL_HREF,
  },
  {
    id: "buy",
    index: "02",
    kicker: "BUY",
    title: "기업 인수",
    copy: "인수조건 설정부터 후보 검토까지.",
    href: LANDING_BUY_HREF,
  },
  {
    id: "tom",
    index: "03",
    kicker: "TOM",
    title: "AI Deal Agent",
    copy: "거래 상황을 이해하고 다음 행동을 제안합니다.",
    href: LANDING_TOM_HREF,
  },
] as const;

export function HomePillars() {
  return (
    <section id="service" className="bg-[#F7F8FA]">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-[7.5rem]">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-navy">Platform</p>
        <h2 className="mt-4 max-w-3xl text-[1.75rem] font-semibold leading-tight tracking-tight text-[#101828] sm:text-[2.25rem] sm:leading-[1.2]">
          하나의 플랫폼에서 M&amp;A를 시작하고, 분석하고, 실행합니다.
        </h2>
        <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-14">
          {pillars.map((item) => (
            <div id={item.id} key={item.id}>
              <p className="font-mono text-[12px] tracking-wide text-navy">{item.index}</p>
              <p className="mt-5 text-[11px] font-medium tracking-[0.2em] text-navy">{item.kicker}</p>
              <h3 className="mt-3 text-[1.35rem] font-semibold tracking-tight text-[#101828]">
                {item.title}
              </h3>
              <p className="mt-3 max-w-sm text-[15px] leading-7 text-[#475467]">{item.copy}</p>
              <Link
                href={item.href}
                className="mt-6 inline-flex text-sm font-medium text-navy underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
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
