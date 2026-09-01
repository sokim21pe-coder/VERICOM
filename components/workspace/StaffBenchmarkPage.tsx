import { StaffBenchmarkForm } from "@/components/workspace/StaffBenchmarkForm";
import { getCurrentContext, listAccessibleDeals } from "@/lib/auth/session";
import { canWriteApprovedValuationBenchmark } from "@/lib/tom/access";
import { staffBenchmarkTargetsFromDeals } from "@/lib/valuation/staff-benchmark-write";

export async function StaffBenchmarkPage({
  screenId,
  workspaceLabel,
}: {
  screenId: string;
  workspaceLabel: string;
}) {
  const context = await getCurrentContext();
  const allowed = context
    ? canWriteApprovedValuationBenchmark(context)
    : false;
  const deals = allowed ? await listAccessibleDeals() : [];
  const targets = staffBenchmarkTargetsFromDeals(deals);

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">{screenId}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        승인 비교배수
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        {workspaceLabel} LEVEL 0 EV/Sales와 LEVEL 1 EV/EBITDA 승인 배수입니다.
        검증된 출처와 기준일이 있을 때만 저장합니다. EV/Sales 배수를 EV/EBITDA에
        쓰지 않습니다. 업종 기본 배수·PLACEHOLDER·TEST_ONLY·DCF는 이 화면에
        없습니다.
      </p>
      {allowed ? (
        <StaffBenchmarkForm targets={targets} />
      ) : (
        <p className="mt-8 text-sm text-muted">권한이 없습니다.</p>
      )}
    </main>
  );
}
