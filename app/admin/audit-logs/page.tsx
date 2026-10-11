import { AdminPager, AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { loadAdminAuditLogs } from "@/lib/admin/data";
import { formatWhen } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; offset?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const offset = Number(params.offset ?? 0) || 0;
  const result = await loadAdminAuditLogs({ query, offset, limit: 20 });
  const href = query ? `/admin/audit-logs?q=${encodeURIComponent(query)}` : "/admin/audit-logs";

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <p className="text-[11px] tracking-[0.18em] text-navy">A05</p>
      <h1 className="mt-2 text-2xl font-semibold">Audit Logs</h1>
      <p className="mt-3 text-sm text-muted">
        일반 사용자는 기존 actor-scoped 정책을 유지합니다. 이 목록은 Super Admin RPC만 사용합니다.
      </p>
      {result.message ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {result.message}
        </p>
      ) : null}
      <AdminSearchForm action="/admin/audit-logs" query={query} />
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3">시각</th>
              <th className="py-2 pr-3">Action</th>
              <th className="py-2 pr-3">Actor</th>
              <th className="py-2 pr-3">대상</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.id} className="border-b border-line">
                <td className="py-2 pr-3">{formatWhen(row.created_at)}</td>
                <td className="py-2 pr-3">{row.action}</td>
                <td className="py-2 pr-3">{row.actor_email ?? row.actor_user_id ?? "확인 필요"}</td>
                <td className="py-2 pr-3">
                  {row.entity_type ?? "-"} {row.entity_id ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPager href={href} total={result.total} limit={result.limit} offset={result.offset} />
    </main>
  );
}
