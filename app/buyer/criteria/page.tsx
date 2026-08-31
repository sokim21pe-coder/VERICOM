import Link from "next/link";
import { FieldRows } from "@/components/workspace/WorkspaceHomeSections";
import { getCurrentContext } from "@/lib/auth/session";
import { loadBuyerCriteriaView } from "@/lib/workspace/load-home";

export const dynamic = "force-dynamic";

export default async function BuyerCriteriaPage() {
  const context = await getCurrentContext();
  const view = context ? await loadBuyerCriteriaView() : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">B02</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        인수조건
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        TOM 상담에서 받은 조건을 정규화한 결과입니다. Matching은 하지 않습니다.
      </p>
      {view ? (
        <>
          <p className="mt-8 text-sm text-muted">{view.matching.statusLabel}</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground">
            {view.matching.copy}
          </p>
          <FieldRows fields={view.rows} />
        </>
      ) : (
        <p className="mt-8 text-sm text-muted">데이터 없음</p>
      )}
      <Link
        href="/consult?intent=buy"
        className="mt-8 inline-flex text-sm text-navy underline"
      >
        TOM 상담으로 인수조건 정리
      </Link>
    </main>
  );
}
