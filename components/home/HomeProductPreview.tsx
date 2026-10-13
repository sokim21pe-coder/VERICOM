export function HomeProductPreview() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="rounded-xl border border-[#E4E7EC] bg-white p-4 shadow-[0_18px_40px_-24px_rgba(0,33,71,0.28)] sm:p-5">
        <div className="flex items-center justify-between border-b border-[#E4E7EC] pb-3">
          <p className="text-[11px] font-medium tracking-[0.16em] text-navy">DEAL WORKSPACE</p>
          <p className="text-[11px] text-[#475467]">Seller · Teaser</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <PreviewCard title="Deal Stage" value="티저 작성" note="13단계 표준 흐름" />
          <PreviewCard title="TOM(AI)" value="다음 행동 제안" note="Deal Context 기반" />
          <PreviewCard title="Valuation" value="LEVEL 0 / LEVEL 1" note="승인 배수만 계산" />
          <PreviewCard title="Teaser" value="Draft → Review → 승인" note="현재 사용 가능" />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <PreviewCard title="Documents" value="Teaser 메타·버전" note="NDA / IM은 준비 중" planned />
          <PreviewCard title="Buyer Matching" value="조건 정리" note="추천 엔진은 준비 중" planned />
        </div>
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  value,
  note,
  planned = false,
}: {
  title: string;
  value: string;
  note: string;
  planned?: boolean;
}) {
  return (
    <div className="rounded-md border border-[#E4E7EC] bg-[#F7F8FA] px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] tracking-wide text-[#475467]">{title}</p>
        {planned ? (
          <span className="rounded-full border border-[#E4E7EC] bg-white px-1.5 py-0.5 text-[10px] text-[#475467]">
            준비 중
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 text-sm font-medium text-[#101828]">{value}</p>
      <p className="mt-1 text-[12px] leading-5 text-[#475467]">{note}</p>
    </div>
  );
}
