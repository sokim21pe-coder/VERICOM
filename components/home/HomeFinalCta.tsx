import Link from "next/link";
import { HOME_FINAL_CTA } from "@/lib/landing/home-presentation";

export function HomeFinalCta() {
  return (
    <section className="bg-navy">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-6 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-end lg:justify-between lg:px-10 lg:py-24">
        <h2 className="max-w-xl text-[1.75rem] font-semibold leading-tight text-white sm:text-[2.25rem]">
          M&amp;A의 다음 단계, VERICOM에서 시작하세요.
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row">
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
