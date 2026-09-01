import { BrandLogo } from "@/components/layout/BrandLogo";
import { LEGAL_ENTITY } from "@/lib/brand/legal-entity";

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-[#FFFFFF] px-5 py-12 text-sm text-muted sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="bg-[#FFFFFF]">
          <BrandLogo className="h-11 sm:h-12" />
        </div>
        <div className="max-w-xl space-y-4 leading-6">
          <p className="text-foreground">베리컴 · M&amp;A, Your Way</p>
          <div>
            <h2 className="text-sm font-semibold text-foreground">회사소개</h2>
            <dl className="mt-2 space-y-1.5">
              <div>
                <dt className="inline text-foreground">회사명 </dt>
                <dd className="inline">{LEGAL_ENTITY.legalName}</dd>
              </div>
              <div>
                <dt className="inline text-foreground">대표 </dt>
                <dd className="inline">{LEGAL_ENTITY.representative}</dd>
              </div>
              <div>
                <dt className="inline text-foreground">연락처 </dt>
                <dd className="inline">{LEGAL_ENTITY.contact}</dd>
              </div>
              <div>
                <dt className="inline text-foreground">사업자등록번호 </dt>
                <dd className="inline">
                  {LEGAL_ENTITY.businessRegistrationNumber}
                </dd>
              </div>
              <div>
                <dt className="text-foreground">소재지</dt>
                <dd>{LEGAL_ENTITY.address}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </footer>
  );
}
