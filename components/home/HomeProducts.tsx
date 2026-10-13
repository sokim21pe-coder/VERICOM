const stories = [
  {
    kicker: "A",
    title: "Deal Intelligence",
    copy: "TOM이 Deal Context와 Stage를 읽고 다음 행동을 제안합니다.",
    items: [
      { label: "TOM / Deal Context", status: "사용 가능" },
      { label: "Deal Stage", status: "사용 가능" },
      { label: "Next Action", status: "사용 가능" },
      { label: "Risk Flag", status: "준비 중" },
    ],
    preview: {
      eyebrow: "CURRENT CONTEXT",
      title: "Seller Workspace · Teaser",
      rows: ["Deal Stage 02 / 13", "Next: 티저 초안 검토", "Risk Flag · 준비 중"],
    },
  },
  {
    kicker: "B",
    title: "Valuation & Financial Analysis",
    copy: "LLM이 숫자를 만들지 않습니다. 정규화 입력과 승인된 비교배수만 계산합니다.",
    items: [
      { label: "Financial Normalization", status: "사용 가능" },
      { label: "LEVEL 0 / LEVEL 1", status: "사용 가능" },
      { label: "Approved Benchmark", status: "사용 가능" },
      { label: "Valuation Range", status: "사용 가능" },
    ],
    preview: {
      eyebrow: "VALUATION",
      title: "LEVEL 0 / LEVEL 1",
      rows: ["정규화 입력", "승인된 비교배수만 적용", "범위 산출 · 최종 숫자는 승인"],
    },
  },
  {
    kicker: "C",
    title: "Secure Deal Execution",
    copy: "문서는 승인 게이트를 거칩니다. 미리보기나 저장이 승인이 아닙니다.",
    items: [
      { label: "Teaser Draft / Approval", status: "사용 가능" },
      { label: "NDA", status: "준비 중" },
      { label: "IM / VDR", status: "준비 중" },
      { label: "Audit Trail", status: "사용 가능" },
    ],
    preview: {
      eyebrow: "APPROVAL GATE",
      title: "Draft → Review → Approve",
      rows: ["Teaser · 사용 가능", "NDA / IM / VDR · 준비 중", "Audit · 행위자·대상·사유"],
    },
  },
] as const;

export function HomeProducts() {
  return (
    <section className="border-b border-[#E4E7EC] bg-white">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-[7.5rem]">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#101828] sm:text-[2.25rem]">
          운영에 필요한 세 가지 축
        </h2>
        <div className="mt-14 space-y-16">
          {stories.map((story) => (
            <article
              key={story.kicker}
              className="grid items-start gap-8 border-t border-[#E4E7EC] pt-8 lg:grid-cols-2 lg:gap-16"
            >
              <div>
                <p className="text-[11px] tracking-[0.18em] text-navy">{story.kicker}</p>
                <h3 className="mt-3 text-2xl font-semibold text-[#101828]">{story.title}</h3>
                <p className="mt-3 max-w-md text-[16px] leading-7 text-[#475467]">{story.copy}</p>
                <dl className="mt-6 divide-y divide-[#E4E7EC] border-t border-[#E4E7EC]">
                  {story.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-[15px] text-[#101828]">{item.label}</dt>
                      <dd className="text-[12px] text-[#475467]">{item.status}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <ProductMock
                eyebrow={story.preview.eyebrow}
                title={story.preview.title}
                rows={story.preview.rows}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductMock({
  eyebrow,
  title,
  rows,
}: {
  eyebrow: string;
  title: string;
  rows: readonly string[];
}) {
  return (
    <div
      aria-hidden="true"
      className="rounded-xl border border-[#E4E7EC] bg-[#F7F8FA] p-4 shadow-[0_18px_40px_-28px_rgba(0,33,71,0.22)] sm:p-5"
    >
      <div className="rounded-lg border border-[#E4E7EC] bg-white px-4 py-4">
        <p className="text-[11px] tracking-[0.16em] text-navy">{eyebrow}</p>
        <p className="mt-2 text-sm font-medium text-[#101828]">{title}</p>
        <ul className="mt-4 divide-y divide-[#E4E7EC] border-t border-[#E4E7EC]">
          {rows.map((row) => (
            <li key={row} className="py-2.5 text-[13px] leading-6 text-[#475467]">
              {row}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
