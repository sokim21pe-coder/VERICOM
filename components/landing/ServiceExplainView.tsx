import Link from "next/link";
import { ServiceAuthCtas } from "@/components/landing/ServiceAuthCtas";
import {
  landingSectionBackLabel,
  serviceAuthHrefs,
  type LandingServicePage,
} from "@/lib/landing/service-pages";

export function ServiceExplainView({
  page,
  signedIn,
}: {
  page: LandingServicePage;
  signedIn: boolean;
}) {
  const auth = serviceAuthHrefs(page);

  return (
    <main className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
      <p className="font-mono text-[11px] text-navy">{page.kicker}</p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {page.title}
      </h1>
      <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base">
        {page.lead}
      </p>
      {page.paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className="mt-4 max-w-2xl text-[15px] leading-7 text-muted sm:text-base"
        >
          {paragraph}
        </p>
      ))}

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-foreground">
        지금 되는 것
      </h2>
      <ul className="mt-3 max-w-2xl list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted sm:text-base">
        {page.available.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <h2 className="mt-8 text-lg font-semibold tracking-tight text-foreground">
        아직인 것
      </h2>
      <ul className="mt-3 max-w-2xl list-disc space-y-2 pl-5 text-[15px] leading-7 text-muted sm:text-base">
        {page.upcoming.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <ServiceAuthCtas
        signedIn={signedIn}
        loginHref={auth.login}
        signupHref={auth.signup}
        continueHref={page.loginNext}
        intent={page.intent}
        startIntent={page.startIntent}
        showStartCta={page.showStartCta}
      />

      <p className="mt-8 text-sm text-muted">
        <Link href={page.sectionHref ?? "/#service"} className="text-navy underline">
          {landingSectionBackLabel(page)}
        </Link>
        {" · "}
        <Link href="/" className="text-navy underline">
          홈으로
        </Link>
      </p>
    </main>
  );
}
