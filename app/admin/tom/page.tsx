import Link from "next/link";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminPager, AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { loadAdminTomConversations } from "@/lib/admin/data";
import { formatWhen, tomIntentLabel } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminTomPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; status?: string; offset?: string }>;
}) {
  const params = await searchParams;
  const intent = params.intent?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const offset = Number(params.offset ?? 0) || 0;
  const result = await loadAdminTomConversations({ intent, status, offset, limit: 20 });
  const qs = new URLSearchParams();
  if (intent) qs.set("intent", intent);
  if (status) qs.set("status", status);
  const href = `/admin/tom${qs.toString() ? `?${qs}` : ""}`;

  return (
    <AdminPage
      screenId="A07"
      title="TOM(AI) 개요"
      description="상담 메타데이터만 표시합니다. 메시지 본문, Memory 값, Prompt, API Key는 열지 않습니다. Buyer 상호 정보 접근을 막기 위해 대화 상세 화면은 두지 않습니다."
      crumbs={[{ label: "AI Overview" }]}
      notice={result.message}
    >
      <AdminSearchForm
        action="/admin/tom"
        query=""
        hideQuery
        extra={
          <>
            <label className="text-sm">
              <span className="mb-1 block text-muted">의도</span>
              <select
                name="intent"
                defaultValue={intent}
                className="rounded-md border border-line px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                <option value="sell">매각(sell)</option>
                <option value="buy">인수(buy)</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted">상태</span>
              <select
                name="status"
                defaultValue={status}
                className="rounded-md border border-line px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                <option value="active">진행</option>
                <option value="archived">보관</option>
              </select>
            </label>
          </>
        }
      />
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3">사용자</th>
              <th className="py-2 pr-3">회사</th>
              <th className="py-2 pr-3">의도</th>
              <th className="py-2 pr-3">상태</th>
              <th className="hidden py-2 pr-3 sm:table-cell">메시지</th>
              <th className="hidden py-2 pr-3 md:table-cell">최근 메시지</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-muted">
                  등록된 TOM 상담이 없습니다.
                </td>
              </tr>
            ) : (
              result.rows.map((row) => (
                <tr key={row.id} className="border-b border-line">
                  <td className="py-3 pr-3">
                    <Link href={`/admin/users/${row.user_id}`} className="text-navy underline">
                      {row.display_name || row.email || "사용자"}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">
                    {row.company_id ? (
                      <Link href={`/admin/companies/${row.company_id}`} className="text-navy underline">
                        {row.company_name || "확인 필요"}
                      </Link>
                    ) : (
                      "없음"
                    )}
                  </td>
                  <td className="py-3 pr-3">{tomIntentLabel(row.intent)}</td>
                  <td className="py-3 pr-3">{row.status === "active" ? "진행" : "보관"}</td>
                  <td className="hidden py-3 pr-3 sm:table-cell">{row.message_count}</td>
                  <td className="hidden py-3 pr-3 md:table-cell">
                    {formatWhen(row.last_message_at || row.created_at)}
                  </td>
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
