import Link from "next/link";
import { LANDING_EXPERT_HREF, LANDING_GUIDE_HREF } from "@/lib/landing/service-pages";

const modes = [
  {
    title: "Self-Service",
    copy: "플랫폼에서 직접 매각·인수 상담과 워크스페이스를 진행합니다.",
  },
  {
    title: "AI-Assisted",
    copy: "TOM과 함께 Deal Context를 정리하고 다음 단계를 준비합니다.",
  },
  {
    title: "Advisor-Assisted",
    copy: "회계·법률·세무 등 전문 판단이 필요할 때 Expert를 배정합니다.",
  },
] as const;

export function HomeModes() {
  return (
    <section id="expert" className="border-b border-[#E4E7EC] bg-[#F7F8FA]">
      <div className="mx-auto w-full max-w-[1200px] px-6 py-20 sm:px-8 sm:py-24 lg:px-10 lg:py-28">
        <h2 className="text-[1.75rem] font-semibold tracking-tight text-[#101828] sm:text-[2.25rem]">
          필요한 만큼만 사람과 함께합니다.
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {modes.map((mode) => (
            <article key={mode.title} className="border-t border-[#E4E7EC] pt-5">
              <h3 className="text-lg font-semibold text-[#101828]">{mode.title}</h3>
              <p className="mt-3 text-[15px] leading-7 text-[#475467]">{mode.copy}</p>
            </article>
          ))}
        </div>
        <p id="guide" className="mt-10 text-sm leading-6 text-[#475467]">
          이용 순서는 랜딩 → 회원가입 또는 로그인 → 이용목적 선택 → 회사 연결 →
          워크스페이스 → TOM 상담입니다.{" "}
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
