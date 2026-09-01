import { BrandLogo } from "@/components/layout/BrandLogo";

export function PublicFooter() {
  return (
    <footer className="border-t border-line bg-[#FFFFFF] px-5 py-12 text-sm text-muted sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="bg-[#FFFFFF]">
          <BrandLogo className="h-11 sm:h-12" />
        </div>
        <div className="max-w-md space-y-1.5 leading-6">
          <p className="text-foreground">베리컴 · M&amp;A, Your Way</p>
          <p>TODO: 공식 법인명</p>
          <p>TODO: 본사 주소</p>
          <p>TODO: 대표 이메일 · 전화번호</p>
        </div>
      </div>
    </footer>
  );
}
