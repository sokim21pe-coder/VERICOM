import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LEGAL_ENTITY } from "@/lib/brand/legal-entity";
import {
  LANDING_BUY_HREF,
  LANDING_EXPERT_HREF,
  LANDING_GUIDE_HREF,
  LANDING_SELL_HREF,
} from "@/lib/landing/service-pages";

const serviceLinks = [
  { href: "/#service", label: "서비스 소개" },
  { href: LANDING_SELL_HREF, label: "기업 매각" },
  { href: LANDING_BUY_HREF, label: "기업 인수" },
  { href: LANDING_EXPERT_HREF, label: "전문가" },
  { href: LANDING_GUIDE_HREF, label: "이용안내" },
] as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-[#E4E7EC] bg-[#F7F8FA] px-6 py-16 text-sm text-[#475467] sm:px-8 lg:px-10 lg:py-20">
      <div className="mx-auto grid w-full max-w-[1200px] gap-12 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,1.2fr)] md:gap-16">
        <div>
          <BrandLogo className="h-12 sm:h-[3.25rem]" />
          <p className="mt-6 text-[15px] font-medium text-[#101828]">베리컴</p>
          <p className="mt-1 text-[13px] tracking-wide text-[#475467]">M&amp;A, Your Way</p>
        </div>
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-navy">서비스</h2>
          <ul className="mt-4 space-y-2.5">
            {serviceLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[#101828] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-navy">회사</h2>
          <dl className="mt-4 space-y-2.5 leading-6">
            <div>
              <dt className="inline text-[#101828]">회사명 </dt>
              <dd className="inline">{LEGAL_ENTITY.legalName}</dd>
            </div>
            <div>
              <dt className="inline text-[#101828]">대표 </dt>
              <dd className="inline">{LEGAL_ENTITY.representative}</dd>
            </div>
            <div>
              <dt className="inline text-[#101828]">연락처 </dt>
              <dd className="inline">{LEGAL_ENTITY.contact}</dd>
            </div>
            <div>
              <dt className="inline text-[#101828]">사업자등록번호 </dt>
              <dd className="inline">{LEGAL_ENTITY.businessRegistrationNumber}</dd>
            </div>
            <div>
              <dt className="text-[#101828]">소재지</dt>
              <dd>{LEGAL_ENTITY.address}</dd>
            </div>
          </dl>
        </div>
      </div>
    </footer>
  );
}
