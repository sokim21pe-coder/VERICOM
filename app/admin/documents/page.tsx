import Link from "next/link";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminPager, AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { loadAdminTeasers } from "@/lib/admin/data";
import { formatWhen, teaserStatusLabel } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; offset?: string }>;
}) {
  const params = await searchParams;
  const status = params.status?.trim() ?? "";
  const offset = Number(params.offset ?? 0) || 0;
  const result = await loadAdminTeasers({ status, offset, limit: 20 });
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  const href = `/admin/documents${qs.toString() ? `?${qs}` : ""}`;

  return (
    <AdminPage
      screenId="A06"
      title="문서"
      description="현재 연결된 문서는 Seller Teaser 메타데이터만입니다. NDA, IM/CIM, LOI, VDR은 아직 없습니다. Teaser 본문(content)과 버전 내용은 열지 않습니다."
      crumbs={[{ label: "Documents" }]}
      notice={result.message}
    >
      <AdminSearchForm
        action="/admin/documents"
        query=""
        hideQuery
        extra={
          <label className="text-sm">
            <span className="mb-1 block text-muted">상태</span>
            <select
              name="status"
              defaultValue={status}
              className="rounded-md border border-line px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              <option value="DRAFT">초안</option>
              <option value="IN_REVIEW">검토 중</option>
              <option value="APPROVED">승인</option>
            </select>
          </label>
        }
      />
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3">제목</th>
              <th className="py-2 pr-3">회사</th>
              <th className="py-2 pr-3">상태</th>
              <th className="py-2 pr-3">버전</th>
              <th className="hidden py-2 pr-3 sm:table-cell">생성</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-muted">
                  등록된 Teaser가 없습니다.
                </td>
              </tr>
            ) : (
              result.rows.map((row) => (
                <tr key={row.id} className="border-b border-line">
                  <td className="py-3 pr-3">
                    {row.deal_id ? (
                      <Link href={`/admin/deals/${row.deal_id}`} className="text-navy underline">
                        {row.headline || row.masked_descriptor || "제목 없음"}
                      </Link>
                    ) : (
                      row.headline || row.masked_descriptor || "제목 없음"
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <Link href={`/admin/companies/${row.company_id}`} className="text-navy underline">
                      {row.company_name || "확인 필요"}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">{teaserStatusLabel(row.status)}</td>
                  <td className="py-3 pr-3">
                    v{row.current_version}
                    {row.approved_version ? ` / 승인 v${row.approved_version}` : ""}
                  </td>
                  <td className="hidden py-3 pr-3 sm:table-cell">{formatWhen(row.created_at)}</td>
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
