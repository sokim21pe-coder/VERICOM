import { AppWindow } from "@/components/home/home-ui";
import { HOME_AVAILABILITY } from "@/lib/landing/home-presentation";
import type { ReactNode } from "react";

const stories = [
  {
    kicker: "A",
    title: "Deal Intelligence",
    copy: "거래 상황과 다음 행동을 구조화합니다.",
    reverse: false,
    items: ["Current Context", "Next Action", "Stage"],
    planned: `Risk Flag · ${HOME_AVAILABILITY.planned}`,
  },
  {
    kicker: "B",
    title: "Valuation & Financial Analysis",
    copy: "정규화 입력과 승인된 비교배수만 계산합니다. 최종 숫자는 사람이 승인합니다.",
    reverse: true,
    items: ["Normalized Financials", "Benchmark", "Valuation Range"],
    planned: null,
  },
  {
    kicker: "C",
    title: "Secure Deal Execution",
    copy: "문서는 승인 게이트를 거칩니다. 저장이 승인이 아닙니다.",
    reverse: false,
    items: ["Draft", "Review", "Approval", "Audit"],
    planned: `NDA, IM, VDR · ${HOME_AVAILABILITY.planned}`,
  },
] as const;

export function HomeProducts() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-[7.5rem]">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-navy">Product</p>
        <h2 className="mt-4 text-[1.75rem] font-semibold tracking-tight text-[#101828] sm:text-[2.25rem]">
          운영에 필요한 세 가지 축
        </h2>
        <div className="mt-16 space-y-20 lg:space-y-28">
          {stories.map((story) => (
            <article
              key={story.kicker}
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${
                story.reverse ? "lg:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div>
                <p className="text-[11px] tracking-[0.18em] text-navy">{story.kicker}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[#101828]">
                  {story.title}
                </h3>
                <p className="mt-3 max-w-md text-[16px] leading-7 text-[#475467]">{story.copy}</p>
                <ul className="mt-7 space-y-2.5">
                  {story.items.map((item) => (
                    <li key={item} className="text-[15px] text-[#101828]">
                      {item}
                    </li>
                  ))}
                </ul>
                {story.planned ? (
                  <p className="mt-5 text-[12px] text-[#475467]">{story.planned}</p>
                ) : null}
              </div>
              {story.kicker === "A" ? <DealIntelligenceMock /> : null}
              {story.kicker === "B" ? <ValuationMock /> : null}
              {story.kicker === "C" ? <ApprovalMock /> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DealIntelligenceMock() {
  return (
    <ProductFrame>
      <AppWindow title="CURRENT CONTEXT" meta="Seller Workspace">
        <div className="min-h-[240px] space-y-4 px-5 py-5 sm:min-h-[280px] sm:px-6 sm:py-6">
          <Row label="Stage" value="02 / 13 · Teaser" />
          <Row label="Next Action" value="티저 초안 검토" />
          <Row label="TOM" value="승인 게이트로 이동" />
          <p className="border-t border-[#E4E7EC] pt-3 text-[12px] text-[#475467]">
            Risk Flag · {HOME_AVAILABILITY.planned}
          </p>
        </div>
      </AppWindow>
    </ProductFrame>
  );
}

function ValuationMock() {
  return (
    <ProductFrame>
      <AppWindow title="VALUATION" meta="LEVEL 0 / 1">
        <div className="min-h-[240px] space-y-4 px-5 py-5 sm:min-h-[280px] sm:px-6 sm:py-6">
          <Row label="Normalized Financials" value="정규화 입력" />
          <Row label="Benchmark" value="승인된 비교배수만 적용" />
          <Row label="Valuation Range" value="범위 산출 · 최종 숫자는 승인" />
        </div>
      </AppWindow>
    </ProductFrame>
  );
}

function ApprovalMock() {
  return (
    <ProductFrame>
      <AppWindow title="APPROVAL GATE" meta="Teaser">
        <ol className="min-h-[240px] px-5 py-5 sm:min-h-[280px] sm:px-6">
          {[
            { label: "Draft", note: "티저 초안" },
            { label: "Review", note: "사람 검토" },
            { label: "Approval", note: "명시적 승인" },
            { label: "Audit", note: "행위자 · 대상 · 사유" },
          ].map((step, index, list) => (
            <li key={step.label} className="flex gap-4">
              <div className="flex w-5 flex-col items-center">
                <span className="mt-1.5 size-2 rounded-full bg-navy" />
                {index < list.length - 1 ? (
                  <span aria-hidden="true" className="w-px flex-1 bg-[#E4E7EC]" />
                ) : null}
              </div>
              <div className="pb-5">
                <p className="text-[15px] font-medium text-[#101828]">{step.label}</p>
                <p className="mt-1 text-[12px] text-[#475467]">{step.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </AppWindow>
    </ProductFrame>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[#E4E7EC] pb-3">
      <p className="text-[11px] tracking-[0.12em] text-[#475467]">{label}</p>
      <p className="text-right text-[13px] font-medium text-[#101828]">{value}</p>
    </div>
  );
}

function ProductFrame({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="relative">
      <div className="absolute inset-x-5 top-5 bottom-0 rounded-xl border border-[#E4E7EC] bg-[#F7F8FA]" />
      <div className="relative">{children}</div>
    </div>
  );
}
