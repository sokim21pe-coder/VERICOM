import Link from "next/link";
import { homeSellerPhases } from "@/lib/landing/home-presentation";
import { LANDING_BUY_HREF } from "@/lib/landing/service-pages";

export function HomeWorkflow() {
  const phases = homeSellerPhases();

  return (
    <section id="journey" className="border-b border-[#E4E7EC] bg-[#F7F8FA]">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-[7.5rem]">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#101828] sm:text-[2.25rem]">
          Standard M&amp;A Workflow
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#475467]">
          매각 측 표준 13단계는 바꾸지 않습니다. 홈에서는 네 개의 Phase로 읽고, 각 Phase 안에서
          원래 순서를 그대로 확인합니다.
        </p>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {phases.map((phase) => (
            <article key={phase.key} className="border-t border-[#E4E7EC] pt-5">
              <h3 className="text-sm font-semibold tracking-wide text-navy">{phase.title}</h3>
              <ol className="mt-3 space-y-1.5">
                {phase.steps.map((step) => (
                  <li key={step.key} className="text-[15px] leading-6 text-[#101828]">
                    <span className="mr-2 font-mono text-xs text-navy">
                      {String(step.order).padStart(2, "0")}
                    </span>
                    {step.label}
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
        <p className="mt-10 max-w-3xl text-[13px] leading-6 text-[#475467]">
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
