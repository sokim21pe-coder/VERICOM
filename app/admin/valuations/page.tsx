import Link from "next/link";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminPager, AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { loadAdminValuations } from "@/lib/admin/data";
import { formatWhen, valuationStatusLabel } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminValuationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; offset?: string }>;
}) {
  const params = await searchParams;
  const status = params.status?.trim() ?? "";
  const offset = Number(params.offset ?? 0) || 0;
  const result = await loadAdminValuations({ status, offset, limit: 20 });
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  const href = `/admin/valuations${qs.toString() ? `?${qs}` : ""}`;

  return (
    <AdminPage
      screenId="A08"
      title="가치평가"
      description="저장된 승인 비교배수(approved_valuation_benchmarks) 메타데이터만 조회합니다. EV, Equity Value, 계산 공식은 복제하지 않습니다. Deal별 산출 결과는 Seller Valuation 서비스를 그대로 둡니다."
      crumbs={[{ label: "Valuations" }]}
      notice={result.message}
    >
      <AdminSearchForm
        action="/admin/valuations"
        query=""
        hideQuery
        extra={
          <label className="text-sm">
            <span className="mb-1 block text-muted">승인 상태</span>
            <select
              name="status"
              defaultValue={status}
              className="rounded-md border border-line px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              <option value="APPROVED">승인</option>
              <option value="TEST_ONLY">테스트 전용</option>
              <option value="UNVERIFIED">미확인</option>
            </select>
          </label>
        }
      />
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3">회사</th>
              <th className="py-2 pr-3">방법</th>
              <th className="py-2 pr-3">출처</th>
              <th className="py-2 pr-3">상태</th>
              <th className="hidden py-2 pr-3 sm:table-cell">기준일</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-muted">
                  등록된 비교배수 기록이 없습니다.
                </td>
              </tr>
            ) : (
              result.rows.map((row) => (
                <tr key={row.id} className="border-b border-line">
                  <td className="py-3 pr-3">
                    <Link href={`/admin/companies/${row.company_id}`} className="text-navy underline">
                      {row.company_name || "확인 필요"}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">{row.method}</td>
                  <td className="py-3 pr-3">
                    {row.source} · {row.source_type}
                  </td>
                  <td className="py-3 pr-3">{valuationStatusLabel(row.approval_status)}</td>
                  <td className="hidden py-3 pr-3 sm:table-cell">{row.as_of_date || formatWhen(row.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <AdminPager href={href} total={result.total} limit={result.limit} offset={result.offset} />
    </AdminPage>
  );
}
