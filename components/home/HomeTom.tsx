import Link from "next/link";
import { AppWindow } from "@/components/home/home-ui";
import { LANDING_TOM_HREF } from "@/lib/landing/service-pages";

const flow = ["Deal Context", "Analyze", "Recommend", "Ask Approval", "Record"] as const;

const capabilities = [
  { label: "Deal Context 이해", live: true },
  { label: "기업정보 구조화", live: true },
  { label: "가치평가 지원", live: true },
  { label: "Teaser Draft", live: true },
  { label: "Next Action 제안", live: true },
  { label: "Buyer / Target 추천", live: false },
  { label: "Risk Flag", live: false },
];

export function HomeTom() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-6 py-20 sm:px-8 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-16 lg:px-10 lg:py-[7.5rem]">
        <div>
          <p className="text-[11px] font-medium tracking-[0.2em] text-navy">TOM(AI)</p>
          <h2 className="mt-4 max-w-xl text-[1.75rem] font-semibold leading-tight tracking-tight text-[#101828] sm:text-[2.25rem]">
            Meet TOM.
            <span className="mt-2 block font-medium text-[#475467]">Your AI M&amp;A Deal Agent</span>
          </h2>
          <p className="mt-6 max-w-xl text-[16px] leading-7 text-[#475467]">
            TOM은 챗봇이 아닙니다. Deal Context를 읽고 다음 행동을 제안합니다.
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
                <li key={step} className="flex gap-4">
                  <div className="flex w-6 flex-col items-center">
                    <span className="mt-1 size-2 rounded-full bg-navy" />
                    {index < flow.length - 1 ? (
                      <span aria-hidden="true" className="min-h-8 w-px flex-1 bg-[#E4E7EC]" />
                    ) : null}
                  </div>
                  <p className="pb-6 text-[15px] font-medium text-[#101828]">{step}</p>
                </li>
              ))}
            </ol>
          </AppWindow>
          <ul className="mt-6 grid gap-y-2.5 sm:grid-cols-2 sm:gap-x-12">
            {capabilities.map((item) => (
              <li key={item.label} className="text-[13px] leading-6 text-[#101828]">
                {item.label}
                <span className="ml-2 text-[11px] text-[#475467]">
                  {item.live ? "사용 가능" : "준비 중"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
