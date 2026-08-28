import { PrivateFilePanel } from "@/components/storage/PrivateFilePanel";
import { listCompanyPrivateFiles } from "@/lib/storage/actions";

export const dynamic = "force-dynamic";

export default async function SellerDocsPage() {
  const listed = await listCompanyPrivateFiles();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">S-DOCS</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        자료실
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        회사 멤버만 접근하는 비공개 저장소입니다. 만료되는 서명 URL로만
        받습니다. Deal·NDA(비밀유지계약)·VDR 공개 규칙은 후속 단계이며, 가짜
        거래 상태는 표시하지 않습니다.
      </p>
      <PrivateFilePanel
        initialFiles={listed.files}
        initialError={listed.ok ? null : listed.message}
      />
    </main>
  );
}
