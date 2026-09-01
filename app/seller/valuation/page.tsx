import Link from "next/link";
import { FieldRows } from "@/components/workspace/WorkspaceHomeSections";
import { SellerValuationStatus } from "@/components/workspace/SellerValuationStatus";
import { getCurrentContext } from "@/lib/auth/session";
import { loadSellerValuationView } from "@/lib/workspace/load-home";
import { financialAmountLabel } from "@/lib/workspace/visibility";

export const dynamic = "force-dynamic";

function amountField(
  id: string,
  label: string,
  amount: Parameters<typeof financialAmountLabel>[0],
) {
  const shown = financialAmountLabel(amount);
  return { id, label, presence: shown.presence, value: shown.value };
}

const emptyAmount = {
  krw: null,
  currency: "KRW" as const,
  raw: "",
  unresolved: false,
  provenance: null,
};

export default async function SellerValuationPage() {
  const context = await getCurrentContext();
  const view = context ? await loadSellerValuationView() : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">S02</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        가치평가
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        LEVEL 0은 매출 기준 EV/Sales, LEVEL 1은 EBITDA 기준 EV/EBITDA입니다.
        검증된 비교배수가 있을 때만 기업가치(Enterprise Value) 범위를 표시합니다.
        EV/Sales 배수를 EV/EBITDA에 쓰지 않으며 DCF는 사용하지 않습니다.
      </p>
      {view ? (
        <>
          <h2 className="mt-8 text-lg font-semibold text-foreground">LEVEL 0</h2>
          <div className="mt-4">
            <SellerValuationStatus valuation={view.valuation} />
          </div>
          <h2 className="mt-12 text-lg font-semibold text-foreground">LEVEL 1</h2>
          <div className="mt-4">
            <SellerValuationStatus valuation={view.level1} />
          </div>
          <h2 className="mt-12 text-lg font-semibold text-foreground">재무 입력</h2>
          <p className="mt-2 text-sm text-muted">
            희망 매각가격은 가치평가 계산에 넣지 않습니다.
          </p>
          <FieldRows
            fields={[
              amountField("revenue", "정규화 매출", view.financials?.revenue ?? emptyAmount),
              amountField("ebitda", "EBITDA", view.financials?.ebitda ?? emptyAmount),
              amountField("cash", "현금", view.financials?.cash ?? emptyAmount),
              amountField("debt", "차입", view.financials?.debt ?? emptyAmount),
              amountField("net_debt", "순차입", view.financials?.netDebt ?? emptyAmount),
              {
                id: "industry",
                label: "업종",
                presence: view.financials?.industry ? "입력" : "미입력",
                value: view.financials?.industry ?? null,
              },
            ]}
          />
        </>
      ) : (
        <p className="mt-8 text-sm text-muted">데이터 없음</p>
      )}
      <Link
        href="/consult?intent=sell"
        className="mt-8 inline-flex text-sm text-navy underline"
      >
        TOM 상담으로 재무 입력
      </Link>
    </main>
  );
}
