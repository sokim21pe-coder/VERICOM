import { OutlineIcon } from "@/components/home/home-ui";

const items = [
  {
    icon: "role" as const,
    title: "Role",
    copy: "Platform Role과 Workspace를 서버 Context로 확인합니다.",
  },
  {
    icon: "deal" as const,
    title: "Deal Permission",
    copy: "Deal 참여자와 권한만 해당 거래 데이터에 접근합니다.",
  },
  {
    icon: "isolation" as const,
    title: "Buyer Isolation",
    copy: "Buyer는 허용된 Opportunity 범위만 봅니다. 상호 정보 접근은 없습니다.",
  },
  {
    icon: "gate" as const,
    title: "Approval Gate",
    copy: "Draft → Review → Explicit Approval → Execute 순서를 지킵니다.",
  },
  {
    icon: "storage" as const,
    title: "Private Storage",
    copy: "문서 저장은 비공개 스토리지를 사용합니다.",
  },
  {
    icon: "audit" as const,
    title: "Audit",
    copy: "중요 변경은 행위자, 대상, 사유를 남깁니다.",
  },
] as const;

export function HomeSecurity() {
  return (
    <section className="bg-navy">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-[7.5rem]">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/65">Security</p>
        <h2 className="mt-4 text-[1.75rem] font-semibold tracking-tight text-white sm:text-[2.25rem]">
          Confidential by Design
        </h2>
        <p className="mt-4 max-w-2xl text-[16px] leading-7 text-white/70">
          인증 배지는 표시하지 않습니다. 현재 제품의 접근 통제만 설명합니다.
        </p>
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article key={item.title}>
              <OutlineIcon name={item.icon} className="size-5 text-white" />
              <h3 className="mt-4 text-[16px] font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-6 text-white/70">{item.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
