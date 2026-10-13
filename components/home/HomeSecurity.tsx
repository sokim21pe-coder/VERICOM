const items = [
  {
    title: "Role-based Access",
    copy: "Platform Role과 Workspace를 서버 Context로 확인합니다.",
  },
  {
    title: "Deal-based Permission",
    copy: "Deal 참여자와 권한만 해당 거래 데이터에 접근합니다.",
  },
  {
    title: "Buyer Isolation",
    copy: "Buyer는 허용된 Opportunity 범위만 봅니다. 상호 정보 접근은 없습니다.",
  },
  {
    title: "Private Document Storage",
    copy: "문서 저장은 비공개 스토리지를 사용합니다.",
  },
  {
    title: "Approval Gates",
    copy: "Draft → Review → Explicit Approval → Execute 순서를 지킵니다.",
  },
  {
    title: "Audit Trail",
    copy: "중요 변경은 행위자, 대상, 사유를 남깁니다.",
  },
] as const;

export function HomeSecurity() {
  return (
    <section className="border-b border-[#E4E7EC] bg-white">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-[7.5rem]">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#101828] sm:text-[2.25rem]">
          Confidential by Design
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-[#475467]">
          인증 배지나 외부 수치는 표시하지 않습니다. 현재 제품에 있는 접근 통제만 설명합니다.
        </p>
        <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.title} className="border-t border-[#E4E7EC] pt-5">
              <h3 className="text-[16px] font-semibold text-[#101828]">{item.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-[#475467]">{item.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
