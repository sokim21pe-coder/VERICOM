import { OutlineIcon } from "@/components/home/home-ui";

const items = [
  {
    icon: "role" as const,
    title: "Role-based Access",
    copy: "역할과 Workspace를 서버에서 확인합니다.",
  },
  {
    icon: "deal" as const,
    title: "Deal-based Permission",
    copy: "해당 거래 참여자만 접근합니다.",
  },
  {
    icon: "isolation" as const,
    title: "Buyer Isolation",
    copy: "허용된 범위만 열람합니다. 상호 정보 접근은 없습니다.",
  },
  {
    icon: "gate" as const,
    title: "Approval Gates",
    copy: "초안, 검토, 명시적 승인, 실행 순서를 지킵니다.",
  },
  {
    icon: "storage" as const,
    title: "Private Storage",
    copy: "문서는 비공개 저장소를 사용합니다.",
  },
  {
    icon: "audit" as const,
    title: "Audit Trail",
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
          민감한 M&amp;A 정보는 역할, Deal, 승인 상태에 따라 접근이 통제됩니다.
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
