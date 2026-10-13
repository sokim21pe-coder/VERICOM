import Link from "next/link";
import { HOME_FINAL_CTA } from "@/lib/landing/home-presentation";

export function HomeFinalCta() {
  return (
    <section className="bg-navy">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10 px-6 py-24 sm:px-8 sm:py-28 lg:flex-row lg:items-end lg:justify-between lg:gap-16 lg:px-10 lg:py-32">
        <div className="max-w-xl">
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">Next step</p>
          <h2 className="mt-4 text-[1.85rem] font-semibold leading-tight text-white sm:text-[2.5rem]">
            M&amp;A의 다음 단계,
            <br />
            VERICOM에서 시작하세요.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-7 text-white/75">
            이용목적을 선택하고 회사를 연결하면, 역할에 맞는 워크스페이스에서 바로 이어갑니다.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={HOME_FINAL_CTA.primary.href}
            className="inline-flex h-12 items-center justify-center rounded-md bg-white px-7 text-sm font-semibold text-navy transition-colors hover:bg-[#F7F8FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {HOME_FINAL_CTA.primary.label}
          </Link>
          <Link
            href={HOME_FINAL_CTA.secondary.href}
            className="inline-flex h-12 items-center justify-center rounded-md border border-white/30 px-7 text-sm font-medium text-white transition-colors hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {HOME_FINAL_CTA.secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
