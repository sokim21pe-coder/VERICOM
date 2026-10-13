import Link from "next/link";
import { LANDING_EXPERT_HREF, LANDING_GUIDE_HREF } from "@/lib/landing/service-pages";

const modes = [
  {
    index: "01",
    title: "Self-Service",
    lead: "직접 진행",
            copy: "매각·인수 상담과 워크스페이스를 직접 진행합니다.",
  },
  {
    index: "02",
    title: "AI-Assisted",
    lead: "TOM과 함께 진행",
            copy: "거래 상황을 정리하고 다음 단계를 제안합니다.",
  },
  {
    index: "03",
    title: "Advisor-Assisted",
    lead: "필요할 때 전문가 개입",
    copy: "회계·법률·세무 판단이 필요할 때 전문가를 배정합니다.",
  },
] as const;

export function HomeModes() {
  return (
    <section id="expert" className="bg-white">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-[7.5rem]">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-navy">Operating mode</p>
        <h2 className="mt-4 text-[1.75rem] font-semibold tracking-tight text-[#101828] sm:text-[2.25rem]">
          필요한 만큼만 사람과 함께합니다.
        </h2>
        <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-14">
          {modes.map((mode) => (
            <article key={mode.title}>
              <p className="font-mono text-[12px] text-navy">{mode.index}</p>
              <h3 className="mt-4 text-lg font-semibold text-[#101828]">{mode.title}</h3>
              <p className="mt-2 text-[15px] font-medium text-[#101828]">{mode.lead}</p>
              <p className="mt-3 text-[14px] leading-6 text-[#475467]">{mode.copy}</p>
            </article>
          ))}
        </div>
        <p id="guide" className="mt-12 text-sm leading-6 text-[#475467]">
          이용 순서: 랜딩 → 회원가입 또는 로그인 → 이용목적 선택 → 회사 연결 → 워크스페이스 →
          TOM 상담.{" "}
          <Link href={LANDING_GUIDE_HREF} className="text-navy underline-offset-4 hover:underline">
            이용안내
          </Link>
          {" · "}
          <Link href={LANDING_EXPERT_HREF} className="text-navy underline-offset-4 hover:underline">
            전문가
          </Link>
        </p>
      </div>
    </section>
  );
}
