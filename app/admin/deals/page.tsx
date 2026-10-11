import Link from "next/link";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminPager, AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { loadAdminDeals } from "@/lib/admin/data";
import { formatWhen, sellerStageLabel } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; offset?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const offset = Number(params.offset ?? 0) || 0;
  const result = await loadAdminDeals({ query, offset, limit: 20 });
  const href = query ? `/admin/deals?q=${encodeURIComponent(query)}` : "/admin/deals";

  return (
    <AdminPage
      screenId="A04"
      title="Deal"
      description="목록은 메타데이터만 보여 줍니다. 기밀 본문·Buyer 상세는 표시하지 않습니다."
      crumbs={[{ label: "Deals" }]}
      notice={result.message}
    >
      <AdminSearchForm action="/admin/deals" query={query} />
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3">제목</th>
              <th className="py-2 pr-3">Seller 회사</th>
              <th className="py-2 pr-3">Seller Stage</th>
              <th className="py-2 pr-3">기존 status</th>
              <th className="py-2 pr-3">생성</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-muted">
                  등록된 Deal이 없습니다.
                </td>
              </tr>
            ) : (
              result.rows.map((row) => (
                <tr key={row.id} className="border-b border-line">
                  <td className="py-2 pr-3">
                    <Link href={`/admin/deals/${row.id}`} className="text-navy underline">
                      {row.title || "제목 없음"}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">
                    {row.seller_company_id ? (
                      <Link
                        href={`/admin/companies/${row.seller_company_id}`}
                        className="text-navy underline"
                      >
                        {row.seller_company_name ?? "회사"}
                      </Link>
                    ) : (
                      row.seller_company_name ?? "확인 필요"
                    )}
                  </td>
                  <td className="py-2 pr-3">{sellerStageLabel(row.seller_stage_key)}</td>
                  <td className="py-2 pr-3">{row.status ?? "확인 필요"}</td>
                  <td className="py-2 pr-3">{formatWhen(row.created_at)}</td>
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
