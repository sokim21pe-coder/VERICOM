import { AppWindow } from "@/components/home/home-ui";
import type { ReactNode } from "react";

const stories = [
  {
    kicker: "A",
    title: "Deal Intelligence",
    copy: "TOM이 Deal Context와 Stage를 읽고 다음 행동을 제안합니다.",
    reverse: false,
    items: [
      { label: "TOM / Deal Context", status: "사용 가능" },
      { label: "Deal Stage", status: "사용 가능" },
      { label: "Next Action", status: "사용 가능" },
      { label: "Risk Flag", status: "준비 중" },
    ],
  },
  {
    kicker: "B",
    title: "Valuation & Financial Analysis",
    copy: "LLM이 숫자를 만들지 않습니다. 정규화 입력과 승인된 비교배수만 계산합니다.",
    reverse: true,
    items: [
      { label: "Financial Normalization", status: "사용 가능" },
      { label: "LEVEL 0 / LEVEL 1", status: "사용 가능" },
      { label: "Approved Benchmark", status: "사용 가능" },
      { label: "Valuation Range", status: "사용 가능" },
    ],
  },
  {
    kicker: "C",
    title: "Secure Deal Execution",
    copy: "문서는 승인 게이트를 거칩니다. 미리보기나 저장이 승인이 아닙니다.",
    reverse: false,
    items: [
      { label: "Teaser Draft / Approval", status: "사용 가능" },
      { label: "NDA", status: "준비 중" },
      { label: "IM / VDR", status: "준비 중" },
      { label: "Audit Trail", status: "사용 가능" },
    ],
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
                <dl className="mt-7 space-y-3">
                  {story.items.map((item) => (
                    <div key={item.label} className="flex items-baseline justify-between gap-4">
                      <dt className="text-[15px] text-[#101828]">{item.label}</dt>
                      <dd className="text-[12px] text-[#475467]">{item.status}</dd>
                    </div>
                  ))}
                </dl>
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
        <div className="grid min-h-[240px] sm:min-h-[280px] sm:grid-cols-[9.5rem_minmax(0,1fr)]">
          <aside className="border-b border-[#E4E7EC] bg-[#F7F8FA] px-3 py-4 text-[12px] text-[#475467] sm:border-b-0 sm:border-r">
            <p className="rounded-md bg-white px-2.5 py-2 font-medium text-[#101828] shadow-sm">
              Deal Stage
            </p>
            <p className="px-2.5 py-2">TOM(AI)</p>
            <p className="px-2.5 py-2">Teaser</p>
          </aside>
          <div className="space-y-4 px-5 py-5">
            <p className="text-[11px] tracking-[0.16em] text-[#475467]">NEXT ACTION</p>
            <p className="text-[15px] font-medium text-[#101828]">티저 초안 검토</p>
            <p className="text-[13px] leading-6 text-[#475467]">Deal Stage 02 / 13</p>
            <p className="text-[12px] text-[#475467]">Risk Flag · 준비 중</p>
          </div>
        </div>
      </AppWindow>
    </ProductFrame>
  );
}

function ValuationMock() {
  return (
    <ProductFrame>
      <AppWindow title="VALUATION" meta="LEVEL 0 / LEVEL 1">
        <div className="min-h-[240px] px-5 py-5 sm:min-h-[280px] sm:px-6 sm:py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-[#E4E7EC] bg-[#F7F8FA] px-4 py-4">
              <p className="text-[11px] tracking-[0.14em] text-navy">LEVEL 0</p>
              <p className="mt-2 text-[14px] font-medium text-[#101828]">정규화 입력</p>
              <p className="mt-1 text-[12px] leading-5 text-[#475467]">재무 입력을 정규화합니다.</p>
            </div>
            <div className="rounded-md border border-[#E4E7EC] bg-[#F7F8FA] px-4 py-4">
              <p className="text-[11px] tracking-[0.14em] text-navy">LEVEL 1</p>
              <p className="mt-2 text-[14px] font-medium text-[#101828]">승인된 비교배수</p>
              <p className="mt-1 text-[12px] leading-5 text-[#475467]">승인된 벤치마크만 적용합니다.</p>
            </div>
          </div>
          <p className="mt-5 border-t border-[#E4E7EC] pt-4 text-[13px] leading-6 text-[#475467]">
            범위 산출 · 최종 숫자는 승인. LLM이 가치를 만들지 않습니다.
          </p>
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
            { label: "Draft", note: "Teaser · 사용 가능" },
            { label: "Review", note: "사람 검토" },
            { label: "Approve", note: "Explicit Approval" },
          ].map((step, index) => (
            <li key={step.label} className="flex gap-4">
              <div className="flex w-5 flex-col items-center">
                <span className="mt-1.5 size-2 rounded-full bg-navy" />
                {index < 2 ? <span aria-hidden="true" className="w-px flex-1 bg-[#E4E7EC]" /> : null}
              </div>
              <div className="pb-6">
                <p className="text-[15px] font-medium text-[#101828]">{step.label}</p>
                <p className="mt-1 text-[12px] text-[#475467]">{step.note}</p>
              </div>
            </li>
          ))}
          <li className="border-t border-[#E4E7EC] pt-4 text-[12px] leading-5 text-[#475467]">
            NDA / IM / VDR · 준비 중 · Audit는 행위자·대상·사유를 남깁니다.
          </li>
        </ol>
      </AppWindow>
    </ProductFrame>
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
