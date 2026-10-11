import Link from "next/link";
import { AdminPager, AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { loadAdminUsers } from "@/lib/admin/data";
import { formatWhen, roleLabels } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; offset?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const offset = Number(params.offset ?? 0) || 0;
  const result = await loadAdminUsers({ query, status, offset, limit: 20 });
  const qs = new URLSearchParams();
  if (query) qs.set("q", query);
  if (status) qs.set("status", status);
  const href = `/admin/users${qs.toString() ? `?${qs}` : ""}`;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <p className="text-[11px] tracking-[0.18em] text-navy">A02</p>
      <h1 className="mt-2 text-2xl font-semibold">사용자</h1>
      <p className="mt-3 text-sm text-muted">
        Super Admin RPC로 조회합니다. Last Login은 저장하지 않아 확인 필요입니다.
      </p>
      {result.message ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {result.message}
        </p>
      ) : null}
      <AdminSearchForm
        action="/admin/users"
        query={query}
        extra={
          <label className="text-sm">
            <span className="mb-1 block text-muted">상태</span>
            <select
              name="status"
              defaultValue={status}
              className="rounded-md border border-line px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              <option value="active">active</option>
              <option value="disabled">disabled</option>
            </select>
          </label>
        }
      />
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3">이름</th>
              <th className="py-2 pr-3">이메일</th>
              <th className="py-2 pr-3">Platform Role</th>
              <th className="py-2 pr-3">회사</th>
              <th className="py-2 pr-3">회사 Role</th>
              <th className="py-2 pr-3">상태</th>
              <th className="py-2 pr-3">생성</th>
              <th className="py-2 pr-3">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.id} className="border-b border-line">
                <td className="py-2 pr-3">
                  <Link href={`/admin/users/${row.id}`} className="text-navy underline">
                    {row.display_name}
                  </Link>
                </td>
                <td className="py-2 pr-3">{row.email}</td>
                <td className="py-2 pr-3">{roleLabels(row.platform_roles)}</td>
                <td className="py-2 pr-3">{row.company_name ?? "없음"}</td>
                <td className="py-2 pr-3">{row.membership_role ?? "없음"}</td>
                <td className="py-2 pr-3">{row.status}</td>
                <td className="py-2 pr-3">{formatWhen(row.created_at)}</td>
                <td className="py-2 pr-3">확인 필요</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPager href={href} total={result.total} limit={result.limit} offset={result.offset} />
    </main>
  );
}
