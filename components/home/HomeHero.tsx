import Link from "next/link";
import { HomeProductPreview } from "@/components/home/HomeProductPreview";
import { HOME_HERO_CTA } from "@/lib/landing/home-presentation";

const primaryClass =
  "inline-flex h-12 items-center justify-center rounded-md bg-navy px-7 text-sm font-semibold text-white transition-colors hover:bg-navy-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";
const secondaryClass =
  "inline-flex h-12 items-center justify-center rounded-md border border-line bg-white px-7 text-sm font-medium text-[#101828] transition-colors hover:border-navy hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

export function HomeHero() {
  return (
    <section className="border-b border-[#E4E7EC] bg-white">
      <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-6 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16 lg:px-10 lg:pb-24 lg:pt-20">
        <div className="max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-navy sm:text-xs">
            AI-Native M&amp;A Operating Platform
          </p>
          <h1 className="mt-5 text-[2.125rem] font-semibold leading-[1.18] tracking-tight text-[#101828] sm:text-[2.75rem] sm:leading-[1.12] lg:text-[3.5rem] lg:leading-[1.08]">
            M&amp;A, Your Way.
          </h1>
          <p className="mt-5 max-w-lg text-lg font-medium leading-8 text-[#101828] sm:text-xl sm:leading-8">
            기업 매각·인수·가치평가·딜 실행을 하나의 AI 기반 워크스페이스에서.
          </p>
          <p className="mt-4 max-w-lg text-[16px] leading-7 text-[#475467] sm:text-[17px] sm:leading-8">
            VERICOM은 기업 매각과 인수의 전 과정을 연결하고, TOM(AI)이 거래 상황을
            이해해 다음 행동을 제안하는 AI 기반 M&amp;A Operating Platform입니다.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={HOME_HERO_CTA.primary.href} className={primaryClass}>
              {HOME_HERO_CTA.primary.label}
            </Link>
            <Link href={HOME_HERO_CTA.secondary.href} className={secondaryClass}>
              {HOME_HERO_CTA.secondary.label}
            </Link>
          </div>
        </div>
        <HomeProductPreview />
      </div>
    </section>
  );
}
