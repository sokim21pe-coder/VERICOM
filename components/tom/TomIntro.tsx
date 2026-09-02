import Link from "next/link";
import { TOM_PRODUCT_NAME } from "@/lib/brand/tom-display";
import {
  LANDING_TOM_HREF,
  getLandingServicePage,
} from "@/lib/landing/service-pages";

const titleLinkClass =
  "rounded-sm underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy";

const textLinkClass = "text-navy underline underline-offset-4";

export function TomIntro({ signedIn = false }: { signedIn?: boolean }) {
  const page = getLandingServicePage("tom");
  const continueHref = page?.loginNext ?? "/onboarding/purpose";

  return (
    <section
      id="tom"
      className="rounded-xl border border-line bg-[#FFFFFF] p-5 sm:p-7 lg:p-8"
    >
      <p className="text-[11px] font-medium tracking-[0.2em] text-navy">
        {TOM_PRODUCT_NAME}
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        <Link href={LANDING_TOM_HREF} className={titleLinkClass}>
          거래의 다음 단계를 안내합니다
        </Link>
      </h2>
      <p className="mt-2.5 text-sm leading-relaxed text-muted">
        상담은 로그인 계정에 저장됩니다. 이후 티저, NDA(비밀유지계약),
        IM(투자설명서), LOI(인수의향서), DD(실사) 자료와 연결할 수 있도록
        준비합니다.
      </p>
      {signedIn ? (
        <p className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href={LANDING_TOM_HREF} className={textLinkClass}>
            자세히 보기
          </Link>
          <Link href={continueHref} className={textLinkClass}>
            워크스페이스 열기
          </Link>
        </p>
      ) : (
        <p className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href={LANDING_TOM_HREF} className={textLinkClass}>
            자세히 보기
          </Link>
        </p>
      )}
    </section>
  );
}
