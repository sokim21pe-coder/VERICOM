import { PrivateFilePanel } from "@/components/storage/PrivateFilePanel";
import { listCompanyPrivateFiles } from "@/lib/storage/actions";

export const dynamic = "force-dynamic";

export default async function BuyerDocsPage() {
  const listed = await listCompanyPrivateFiles();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">B-DOCS</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        문서
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        회사 멤버만 접근하는 비공개 저장소입니다. 다른 회사 파일은 보이지
        않습니다. Deal 문서함은 후속 단계입니다.
      </p>
      <PrivateFilePanel
        initialFiles={listed.files}
        initialError={listed.ok ? null : listed.message}
      />
    </main>
  );
}
