import Link from "next/link";

export const dynamic = "force-dynamic";

export default function SellerDocumentsPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">S-DOCS-DEAL</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        문서
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        거래 문서함(NDA, IM, VDR)은 준비 중입니다. 회사 비공개 파일은 자료실에서
        관리합니다.
      </p>
      <Link
        href="/seller/docs"
        className="mt-8 inline-flex text-sm text-navy underline"
      >
        자료실 열기
      </Link>
    </main>
  );
}
