import Link from "next/link";
import { AppWindow } from "@/components/home/home-ui";
import { HOME_AVAILABILITY } from "@/lib/landing/home-presentation";
import { LANDING_TOM_HREF } from "@/lib/landing/service-pages";

const flow = [
  { key: "UNDERSTAND", note: "거래 상황을 읽습니다.", emphasis: false },
  { key: "ANALYZE", note: "분석합니다.", emphasis: false },
  { key: "RECOMMEND", note: "다음 행동을 제안합니다.", emphasis: false },
  { key: "APPROVE", note: "사람이 승인합니다.", emphasis: true },
  { key: "RECORD", note: "VERICOM이 기록합니다.", emphasis: false },
] as const;

export function HomeTom() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-6 py-20 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:px-10 lg:py-[7.5rem]">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-navy">TOM</p>
          <h2 className="mt-4 max-w-xl text-[1.75rem] font-semibold leading-tight tracking-tight text-[#101828] sm:text-[2.25rem]">
            Meet TOM.
            <span className="mt-2 block font-medium text-[#475467]">Your AI M&amp;A Deal Agent</span>
          </h2>
          <p className="mt-6 max-w-xl text-[16px] leading-7 text-[#475467]">
            TOM은 챗봇이 아닙니다. 거래 상황을 이해하고 다음 행동을 제안합니다.
            중요한 실행은 사람이 승인합니다.
          </p>
          <p className="mt-10 max-w-md border-l-2 border-navy pl-5 text-[1.35rem] font-medium leading-8 tracking-tight text-[#101828] sm:text-[1.5rem] sm:leading-9">
            AI recommends.
            <br />
            You approve.
            <br />
            VERICOM records.
          </p>
          <Link
            href={LANDING_TOM_HREF}
            className="mt-8 inline-flex text-sm font-medium text-navy underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
          >
            TOM 자세히 보기
          </Link>
        </div>
        <div>
          <AppWindow title="TOM PANEL" meta="Deal Agent">
            <ol className="px-5 py-5">
              {flow.map((step, index) => (
                <li key={step.key} className="flex gap-4">
                  <div className="flex w-6 flex-col items-center">
                    <span
                      className={`mt-1.5 size-2 rounded-full ${
                        step.emphasis ? "bg-navy ring-4 ring-[#EEF1F6]" : "bg-navy"
                      }`}
                    />
                    {index < flow.length - 1 ? (
                      <span aria-hidden="true" className="min-h-8 w-px flex-1 bg-[#E4E7EC]" />
                    ) : null}
                  </div>
                  <div className="pb-6">
                    <p className="text-[13px] font-semibold tracking-[0.14em] text-[#101828]">
                      {step.key}
                    </p>
                    <p className="mt-1 text-[13px] text-[#475467]">{step.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </AppWindow>
          <p className="mt-5 text-[12px] leading-5 text-[#475467]">
            Buyer 추천, Risk Flag · {HOME_AVAILABILITY.planned}
          </p>
        </div>
      </div>
    </section>
  );
}
