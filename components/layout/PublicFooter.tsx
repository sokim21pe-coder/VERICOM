import { BrandLogo } from "@/components/layout/BrandLogo";
import { LEGAL_ENTITY } from "@/lib/brand/legal-entity";

export function PublicFooter() {
  return (
    <footer className="border-t border-[#E4E7EC] bg-[#F7F8FA] px-6 py-16 text-sm text-[#475467] sm:px-8 lg:px-10 lg:py-[4.5rem]">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <BrandLogo className="h-11 sm:h-12" />
          <p className="mt-5 text-[#101828]">베리컴 · M&amp;A, Your Way</p>
        </div>
        <div className="max-w-xl">
          <h2 className="text-sm font-semibold text-[#101828]">회사소개</h2>
          <dl className="mt-3 space-y-2 leading-6">
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
