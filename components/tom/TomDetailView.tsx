import Link from "next/link";
import { MaWorkflow } from "@/components/landing/MaWorkflow";
import {
  MA_WORKFLOW_LEAD,
  MA_WORKFLOW_TITLE,
} from "@/lib/landing/ma-workflow";
import type { LandingServicePage } from "@/lib/landing/service-pages";
import { signupHref } from "@/lib/tom/paths";
import {
  TOM_AGENT_LOOP,
  TOM_AGENT_LOOP_NOTE,
  TOM_BRAINS,
  TOM_HERO,
  TOM_HITL_BODY,
  TOM_HITL_LINES,
  TOM_INTELLIGENCE_BENEFITS,
  TOM_INTELLIGENCE_LEAD,
  TOM_INTELLIGENCE_NOTE,
  TOM_LAYERS,
  TOM_LAYERS_NOTE,
  TOM_LEADS_CONSIDERATIONS,
  TOM_LEADS_MESSAGE,
  TOM_MEMORY,
  TOM_ROLE_CAPABILITIES,
  TOM_ROLE_LEAD,
  TOM_SECURITY_HEADLINE,
  TOM_SECURITY_INJECTION_NOTE,
  TOM_SECURITY_ITEMS,
  TOM_SECURITY_LEAD,
  TOM_SPECIALIST_LEAD,
  TOM_TOOL_CLASSES,
  TOM_TOOL_NOTE,
  TOM_WORKFLOW_LEAD,
  TOM_WORKFLOW_LINKS,
  TOM_WORKFLOW_STAGE_NOTE,
} from "@/lib/tom/tom-detail";

const containerClass = "mx-auto w-full max-w-6xl px-5 sm:px-8";

const sectionPad = "py-16 sm:py-20 lg:py-24";

const whiteButtonClass =
  "inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-semibold text-navy transition-colors hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

function AccentBar() {
  return (
    <span
      aria-hidden="true"
      className="mb-5 block h-1 w-10 rounded-full bg-navy"
    />
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.2]">
      {children}
    </h2>
  );
}

export function TomDetailView({
  page,
  signedIn,
}: {
  page: LandingServicePage;
  signedIn: boolean;
}) {
  const ctaHref = signedIn ? page.loginNext : signupHref(page.loginNext, null);

  return (
    <main className="bg-white">
      {/* 1. Hero */}
      <section className="relative overflow-hidden border-b border-line bg-navy">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/5 blur-3xl"
        />
        <div className={`relative ${containerClass} py-20 sm:py-24 lg:py-28`}>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-white/70">
            {TOM_HERO.kicker}
          </p>
          <h1 className="mt-5 max-w-3xl break-keep text-3xl font-semibold leading-[1.18] tracking-tight text-white sm:text-4xl lg:text-[2.9rem] lg:leading-[1.12]">
            {TOM_HERO.headline}
          </h1>
          <p className="mt-6 max-w-2xl break-keep text-lg leading-8 text-white/90 sm:text-xl">
            {TOM_HERO.lead}
          </p>
          <p className="mt-4 max-w-2xl break-keep text-[15px] leading-7 text-white/70 sm:text-base sm:leading-8">
            {TOM_HERO.sub}
          </p>
          <div className="mt-9">
            <Link href={ctaHref} className={whiteButtonClass}>
              {TOM_HERO.ctaLabel}
            </Link>
          </div>
        </div>
      </section>

      {/* 2. TOM의 역할 */}
      <section className="border-b border-line bg-white">
        <div className={`${containerClass} ${sectionPad}`}>
          <AccentBar />
          <SectionHeading>TOM의 역할</SectionHeading>
          <p className="mt-4 max-w-3xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            {TOM_ROLE_LEAD}
          </p>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {TOM_ROLE_CAPABILITIES.map((item) => (
              <div
                key={item.title}
                className="flex h-full flex-col rounded-xl border border-line bg-white px-6 py-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <h3 className="break-keep text-base font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2.5 break-keep text-sm leading-6 text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Specialist Brains */}
      <section className="border-b border-line bg-[#f7f8fa]">
        <div className={`${containerClass} ${sectionPad}`}>
          <AccentBar />
          <SectionHeading>하나의 TOM, 내부의 전문 기능</SectionHeading>
          <p className="mt-4 max-w-3xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            {TOM_SPECIALIST_LEAD}
          </p>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {TOM_BRAINS.map((brain) => (
              <div
                key={brain.name}
                className="flex h-full items-start gap-4 rounded-xl border border-line bg-white px-6 py-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 h-9 w-1 shrink-0 rounded-full bg-navy"
                />
                <div className="min-w-0">
                  <h3 className="break-keep text-base font-semibold tracking-tight text-foreground">
                    {brain.name}
                  </h3>
                  <p className="mt-1.5 break-keep text-sm leading-6 text-muted">
                    {brain.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Agent Loop */}
      <section className="border-b border-line bg-white">
        <div className={`${containerClass} ${sectionPad}`}>
          <AccentBar />
          <SectionHeading>TOM의 판단 순서 — Agent Loop</SectionHeading>
          <p className="mt-4 max-w-3xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            {TOM_AGENT_LOOP_NOTE}
          </p>
          <ol className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2">
            {TOM_AGENT_LOOP.map((item, index) => (
              <li
                key={item.step}
                className="flex items-start gap-4 rounded-xl border border-line bg-white px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy font-mono text-xs font-semibold text-white">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="break-keep text-sm font-semibold tracking-tight text-foreground">
                    {item.step}
                  </p>
                  <p className="mt-1 break-keep text-[13px] leading-6 text-muted">
                    {item.note}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 5. TOM Leads the Deal */}
      <section className="border-b border-line bg-[#f7f8fa]">
        <div className={`${containerClass} ${sectionPad}`}>
          <AccentBar />
          <SectionHeading>TOM은 거래를 리딩합니다</SectionHeading>
          <p className="mt-6 max-w-3xl break-keep text-lg leading-8 text-foreground sm:text-xl sm:leading-9">
            “{TOM_LEADS_MESSAGE}”
          </p>
          <p className="mt-6 max-w-3xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            TOM은 질문에만 답하는 Reactive Chatbot이 아니라, 항상 다음을 함께
            고민하는 Agent입니다.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {TOM_LEADS_CONSIDERATIONS.map((item) => (
              <li
                key={item}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Continuous Deal Intelligence */}
      <section className="border-b border-line bg-white">
        <div className={`${containerClass} ${sectionPad}`}>
          <AccentBar />
          <SectionHeading>Continuous Deal Intelligence</SectionHeading>
          <p className="mt-4 max-w-3xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            {TOM_INTELLIGENCE_LEAD}
          </p>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {TOM_MEMORY.map((item) => (
              <div
                key={item.title}
                className="flex h-full flex-col rounded-xl border border-line bg-white px-6 py-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <h3 className="break-keep text-base font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2.5 break-keep text-sm leading-6 text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-5">
            <div className="rounded-xl border border-line bg-[#f7f8fa] px-6 py-6">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                거래가 진행될수록 좋아지는 것
              </h3>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
                {TOM_INTELLIGENCE_BENEFITS.map((item) => (
                  <li key={item} className="break-keep">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center rounded-xl border border-line bg-[#f7f8fa] px-6 py-6">
              <p className="break-keep text-sm leading-7 text-muted">
                {TOM_INTELLIGENCE_NOTE}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. AI + Engine + Expert */}
      <section className="border-b border-line bg-[#f7f8fa]">
        <div className={`${containerClass} ${sectionPad}`}>
          <AccentBar />
          <SectionHeading>AI · Engine · Expert의 역할 분리</SectionHeading>
          <p className="mt-4 max-w-3xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            신뢰할 수 있는 거래를 위해 판단 주체를 분명히 나눕니다.
          </p>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:gap-5 lg:grid-cols-3">
            {TOM_LAYERS.map((layer) => (
              <div
                key={layer.title}
                className="flex h-full flex-col rounded-xl border border-line bg-white px-6 py-7 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <h3 className="break-keep text-lg font-semibold tracking-tight text-foreground">
                  {layer.title}
                </h3>
                <p className="mt-1 text-[13px] font-medium uppercase tracking-wider text-navy">
                  {layer.scope}
                </p>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
                  {layer.items.map((item) => (
                    <li key={item} className="break-keep">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl break-keep rounded-lg border border-line bg-white px-5 py-4 text-sm leading-7 text-muted">
            {TOM_LAYERS_NOTE}
          </p>
        </div>
      </section>

      {/* 8. From Conversation to Execution */}
      <section className="border-b border-line bg-white">
        <div className={`${containerClass} ${sectionPad}`}>
          <AccentBar />
          <SectionHeading>대화에서 실행까지 — Tool Class</SectionHeading>
          <p className="mt-4 max-w-3xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            TOM의 도구는 네 가지 등급으로 구분됩니다. 실행 등급일수록 더 엄격한
            승인·권한을 요구합니다.
          </p>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {TOM_TOOL_CLASSES.map((tool) => (
              <div
                key={tool.code}
                className={`flex h-full flex-col rounded-xl border px-6 py-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${
                  tool.gated
                    ? "border-navy/30 bg-navy/[0.03]"
                    : "border-line bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-navy">
                    {tool.code}
                  </span>
                  {tool.gated ? (
                    <span className="rounded-full border border-navy/30 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-navy">
                      승인 필요
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-3 break-keep text-base font-semibold tracking-tight text-foreground">
                  {tool.title}
                </h3>
                <p className="mt-2 break-keep text-sm leading-6 text-muted">
                  {tool.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl break-keep rounded-lg border border-line bg-[#f7f8fa] px-5 py-4 text-sm leading-7 text-muted">
            {TOM_TOOL_NOTE}
          </p>
        </div>
      </section>

      {/* 9. Workflow Orchestration */}
      <section className="border-b border-line bg-[#f7f8fa]">
        <div className={`${containerClass} ${sectionPad}`}>
          <AccentBar />
          <SectionHeading>거래 전체를 연결하는 Workflow Orchestration</SectionHeading>
          <p className="mt-4 max-w-3xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            {TOM_WORKFLOW_LEAD}
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {TOM_WORKFLOW_LINKS.map((link) => (
              <div
                key={link.title}
                className="rounded-xl border border-line bg-white px-6 py-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <h3 className="break-keep text-sm font-semibold tracking-tight text-navy">
                  {link.title}
                </h3>
                <p className="mt-1.5 break-keep text-sm leading-6 text-muted">
                  {link.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-line bg-white px-6 py-8 sm:px-8 sm:py-10">
            <h3 className="break-keep text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {MA_WORKFLOW_TITLE}
            </h3>
            <p className="mt-3 max-w-2xl break-keep text-sm leading-7 text-muted sm:text-[15px]">
              {MA_WORKFLOW_LEAD}
            </p>
            <div className="mt-8">
              <MaWorkflow variant="compact" />
            </div>
          </div>

          <p className="mt-8 max-w-3xl break-keep rounded-lg border border-line bg-white px-5 py-4 text-sm leading-7 text-muted">
            {TOM_WORKFLOW_STAGE_NOTE}
          </p>
        </div>
      </section>

      {/* 10. Security */}
      <section className="border-b border-line bg-white">
        <div className={`${containerClass} ${sectionPad}`}>
          <AccentBar />
          <SectionHeading>보안 · 권한 — AI Permission Ceiling</SectionHeading>
          <div className="mt-6 rounded-2xl border border-navy/20 bg-navy/[0.03] px-6 py-6 sm:px-8 sm:py-7">
            <p className="font-mono text-sm font-semibold tracking-tight text-navy">
              {TOM_SECURITY_HEADLINE}
            </p>
            <p className="mt-2 break-keep text-base font-semibold text-foreground sm:text-lg">
              {TOM_SECURITY_LEAD}
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {TOM_SECURITY_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex h-full flex-col rounded-xl border border-line bg-white px-6 py-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <h3 className="break-keep text-base font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2.5 break-keep text-sm leading-6 text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl break-keep rounded-lg border border-line bg-[#f7f8fa] px-5 py-4 text-sm leading-7 text-muted">
            {TOM_SECURITY_INJECTION_NOTE}
          </p>
        </div>
      </section>

      {/* 11. Human-in-the-loop */}
      <section className="border-b border-line bg-[#f7f8fa]">
        <div className={`${containerClass} ${sectionPad}`}>
          <AccentBar />
          <SectionHeading>Human-in-the-loop</SectionHeading>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            {TOM_HITL_LINES.map((line) => (
              <div
                key={line}
                className="flex-1 rounded-xl border border-line bg-white px-6 py-6 text-center"
              >
                <p className="break-keep text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                  {line}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            {TOM_HITL_BODY}
          </p>
        </div>
      </section>

      {/* 현재 제공 · 단계적 구축 */}
      <section className="border-b border-line bg-white">
        <div className={`${containerClass} ${sectionPad}`}>
          <AccentBar />
          <SectionHeading>현재 제공 · 단계적 구축</SectionHeading>
          <p className="mt-4 max-w-3xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            아직 준비 중인 기능을 현재 작동하는 것처럼 표현하지 않습니다. 위에서
            설명한 구조는 VERICOM 플랫폼 Architecture이며, 실제 이용 범위는 다음과
            같이 구분됩니다.
          </p>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
            <div className="rounded-xl border border-line bg-white px-6 py-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                지금 되는 것
              </h3>
              <ul className="mt-4 list-disc space-y-2.5 pl-5 text-[15px] leading-7 text-muted">
                {page.available.map((item) => (
                  <li key={item} className="break-keep">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-white px-6 py-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                준비 중인 것
              </h3>
              <ul className="mt-4 list-disc space-y-2.5 pl-5 text-[15px] leading-7 text-muted">
                {page.upcoming.map((item) => (
                  <li key={item} className="break-keep">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 12. CTA */}
      <section className="bg-white">
        <div className={`${containerClass} ${sectionPad}`}>
          <div className="overflow-hidden rounded-2xl border border-line bg-navy px-6 py-10 text-center sm:px-10 sm:py-14">
            <h2 className="break-keep text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              거래의 다음 단계를 TOM과 함께 시작하세요
            </h2>
            <p className="mx-auto mt-4 max-w-2xl break-keep text-[15px] leading-7 text-white/80 sm:text-base sm:leading-8">
              상담은 로그인 계정에 저장됩니다. TOM이 현재 Context를 이해하고, 다음
              행동을 제안하며, 승인된 업무를 거래 Workflow와 연결합니다.
            </p>
            <div className="mt-8 flex justify-center">
              <Link href={ctaHref} className={whiteButtonClass}>
                {TOM_HERO.ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
