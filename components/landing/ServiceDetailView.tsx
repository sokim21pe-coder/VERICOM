import Link from "next/link";
import type { LandingServicePage } from "@/lib/landing/service-pages";
import { signupHref, startFlowHref } from "@/lib/tom/paths";

const containerClass = "mx-auto w-full max-w-6xl px-5 sm:px-8";
const primaryButtonClass =
  "inline-flex h-12 items-center justify-center rounded-md bg-navy px-7 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,33,71,0.24)] transition-colors hover:bg-navy-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

function eyebrowClass() {
  return "text-[11px] font-semibold uppercase tracking-[0.22em] text-navy";
}

function accentBar() {
  return (
    <span
      aria-hidden="true"
      className="mb-5 block h-1 w-10 rounded-full bg-navy"
    />
  );
}

function resolveFinalCta(
  page: LandingServicePage,
  signedIn: boolean,
): { href: string; label: string } {
  const detailLabel = page.detail?.finalCta.primaryLabel ?? "시작하기";

  if (signedIn) {
    if (page.intent === "sell") {
      return { href: page.loginNext, label: "매각 상담 이어가기" };
    }
    if (page.intent === "buy") {
      return { href: page.loginNext, label: "인수 상담 이어가기" };
    }
    return { href: page.loginNext, label: "워크스페이스 열기" };
  }

  if (page.intent === "sell" || page.intent === "buy") {
    return { href: startFlowHref(page.intent), label: detailLabel };
  }
  return { href: signupHref(page.loginNext, null), label: detailLabel };
}

export function ServiceDetailView({
  page,
  signedIn,
}: {
  page: LandingServicePage;
  signedIn: boolean;
}) {
  const detail = page.detail;
  if (!detail) return null;

  const cta = resolveFinalCta(page, signedIn);

  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="border-b border-line bg-white">
        <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
          <p className={`font-mono ${eyebrowClass()}`}>{page.kicker}</p>
          <h1 className="mt-4 max-w-3xl break-keep text-3xl font-semibold leading-[1.2] tracking-tight text-foreground sm:text-4xl lg:text-[2.9rem] lg:leading-[1.14]">
            {page.title}
          </h1>
          <p className="mt-5 max-w-2xl break-keep text-lg leading-8 text-foreground sm:text-xl">
            {page.lead}
          </p>
          <p className="mt-4 max-w-2xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            {detail.heroTagline}
          </p>
          {page.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="mt-4 max-w-2xl break-keep text-[15px] leading-7 text-muted sm:text-base sm:leading-8"
            >
              {paragraph}
            </p>
          ))}
          <div className="mt-8">
            <Link href={cta.href} className={primaryButtonClass}>
              {cta.label}
            </Link>
          </div>
        </div>
      </section>

      {/* 핵심 가치 */}
      <section className="border-b border-line bg-[#f7f8fa]">
        <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
          {accentBar()}
          <h2 className="break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.2]">
            핵심 가치
          </h2>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
            {detail.valueProps.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-line bg-white px-6 py-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-7"
              >
                <h3 className="break-keep text-lg font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2.5 break-keep text-[15px] leading-7 text-muted">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 주요 기능 */}
      <section className="border-b border-line bg-white">
        <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
          {accentBar()}
          <h2 className="break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.2]">
            주요 기능
          </h2>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {detail.features.map((item) => (
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

      {/* 현재 이용 가능 / 준비 중 (기존 콘텐츠 보존) */}
      <section className="border-b border-line bg-[#f7f8fa]">
        <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
          {accentBar()}
          <h2 className="break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.2]">
            현재 이용 가능 · 준비 중
          </h2>
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
                아직인 것
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

      {/* 이용 절차 */}
      <section className="border-b border-line bg-white">
        <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
          {accentBar()}
          <h2 className="break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.2]">
            이용 절차
          </h2>
          <ol className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {detail.steps.map((step) => (
              <li
                key={step.order}
                className="flex h-full flex-col rounded-xl border border-line bg-white px-6 py-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
              >
                <span className="font-mono text-[11px] tracking-wider text-navy">
                  {step.order}
                </span>
                <h3 className="mt-2.5 break-keep text-base font-semibold tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 break-keep text-sm leading-6 text-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 적합 사용자 */}
      <section className="border-b border-line bg-[#f7f8fa]">
        <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
          {accentBar()}
          <h2 className="break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.2]">
            어떤 분에게 적합한가요
          </h2>
          <ul className="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
            {detail.audience.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-line bg-white px-6 py-6 text-[15px] leading-7 text-muted break-keep"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* AI 지원 / 사람 개입 */}
      <section className="border-b border-line bg-white">
        <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
          {accentBar()}
          <h2 className="break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.2]">
            AI 지원과 사람의 개입
          </h2>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-5">
            <div className="rounded-xl border border-line bg-white px-6 py-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                TOM(AI)이 지원하는 부분
              </h3>
              <ul className="mt-4 list-disc space-y-2.5 pl-5 text-[15px] leading-7 text-muted">
                {detail.aiSupport.map((item) => (
                  <li key={item} className="break-keep">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-line bg-white px-6 py-6 sm:p-7">
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                사람이 개입하는 부분
              </h3>
              <ul className="mt-4 list-disc space-y-2.5 pl-5 text-[15px] leading-7 text-muted">
                {detail.humanSupport.map((item) => (
                  <li key={item} className="break-keep">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 보안 · 권한 · 기밀성 */}
      <section className="border-b border-line bg-[#f7f8fa]">
        <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
          {accentBar()}
          <h2 className="break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.2]">
            보안 · 권한 · 기밀성
          </h2>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-5">
            {detail.security.map((item) => (
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

      {/* 기대효과 */}
      <section className="border-b border-line bg-white">
        <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
          {accentBar()}
          <h2 className="break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.2]">
            기대효과
          </h2>
          <ul className="mt-8 max-w-3xl list-disc space-y-3 pl-5 text-[15px] leading-7 text-muted sm:text-base sm:leading-8">
            {detail.outcomes.map((item) => (
              <li key={item} className="break-keep">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-b border-line bg-[#f7f8fa]">
        <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
          {accentBar()}
          <h2 className="break-keep text-2xl font-semibold tracking-tight text-foreground sm:text-[1.9rem] sm:leading-[1.2]">
            자주 묻는 질문
          </h2>
          <dl className="mt-8 max-w-3xl space-y-4 sm:mt-10">
            {detail.faq.map((item) => (
              <div
                key={item.question}
                className="rounded-xl border border-line bg-white px-6 py-5 sm:px-7 sm:py-6"
              >
                <dt className="break-keep text-base font-semibold tracking-tight text-foreground">
                  {item.question}
                </dt>
                <dd className="mt-2.5 break-keep text-[15px] leading-7 text-muted">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 마지막 CTA */}
      <section className="bg-white">
        <div className={`${containerClass} py-16 sm:py-20 lg:py-24`}>
          <div className="rounded-2xl border border-line bg-navy px-6 py-10 text-center sm:px-10 sm:py-14">
            <h2 className="break-keep text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {detail.finalCta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl break-keep text-[15px] leading-7 text-white/80 sm:text-base sm:leading-8">
              {detail.finalCta.body}
            </p>
            <div className="mt-8 flex justify-center">
              <Link
                href={cta.href}
                className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-semibold text-navy transition-colors hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {cta.label}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
