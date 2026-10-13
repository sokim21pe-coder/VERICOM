import Link from "next/link";
import { homeSellerPhases } from "@/lib/landing/home-presentation";
import { LANDING_BUY_HREF } from "@/lib/landing/service-pages";

export function HomeWorkflow() {
  const phases = homeSellerPhases();

  return (
    <section id="journey" className="bg-[#EEF1F6]">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-[7.5rem]">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-navy">Process</p>
        <h2 className="mt-4 text-[1.75rem] font-semibold tracking-tight text-[#101828] sm:text-[2.25rem]">
          Standard M&amp;A Workflow
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#475467]">
          VERICOM은 매각 표준 13단계를 네 개의 Phase로 운영합니다.
        </p>
        <ol className="mt-14 grid gap-10 lg:grid-cols-4 lg:gap-0">
          {phases.map((phase, index) => (
            <li
              key={phase.key}
              className="relative border-l border-[#D0D5DD] pl-5 lg:border-l-0 lg:pr-6 lg:pl-0"
            >
              <div className="mb-5 flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 -left-[5px] size-2.5 rounded-full bg-navy lg:static lg:top-auto lg:left-auto"
                />
                {index < phases.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="hidden h-px flex-1 bg-[#C5CAD3] lg:block"
                  />
                ) : (
                  <span aria-hidden="true" className="hidden flex-1 lg:block" />
                )}
              </div>
              <p className="font-mono text-[11px] tracking-[0.16em] text-navy">{phase.phase}</p>
              <h3 className="mt-1 text-base font-semibold tracking-tight text-[#101828]">
                {phase.label}
              </h3>
              <ol className="mt-4 space-y-2.5">
                {phase.steps.map((step) => (
                  <li key={step.key} className="text-[14px] leading-6 text-[#101828]">
                    <span className="mr-2 font-mono text-[11px] font-medium text-navy">
                      {String(step.order).padStart(2, "0")}
                    </span>
                    {step.label}
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
        <p className="mt-12 max-w-3xl text-[13px] leading-6 text-[#475467]">
          Phase 1 준비 01–03 · Phase 2 분석 04–07 · Phase 3 협상 08–10 · Phase 4 실행 11–13.
          인수 측 표준 흐름은{" "}
          <Link
            href={LANDING_BUY_HREF}
            className="text-navy underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            기업 인수
          </Link>
          안내에서 확인합니다.
        </p>
      </div>
    </section>
  );
}
