import Link from "next/link";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminPager, AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { loadAdminPlatformRoles, loadAdminUsers } from "@/lib/admin/data";
import { formatWhen, roleLabels } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; role?: string; offset?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const status = params.status?.trim() ?? "";
  const role = params.role?.trim() ?? "";
  const offset = Number(params.offset ?? 0) || 0;
  const [result, catalog] = await Promise.all([
    loadAdminUsers({ query, status, role, offset, limit: 20 }),
    loadAdminPlatformRoles(),
  ]);
  const qs = new URLSearchParams();
  if (query) qs.set("q", query);
  if (status) qs.set("status", status);
  if (role) qs.set("role", role);
  const href = `/admin/users${qs.toString() ? `?${qs}` : ""}`;

  return (
    <AdminPage
      screenId="A02"
      title="사용자"
      description="Super Admin RPC로 조회합니다. Last Login은 Auth 값을 안전하게 못 읽으면 확인 필요입니다."
      crumbs={[{ label: "Users" }]}
      notice={result.message}
    >
      <AdminSearchForm
        action="/admin/users"
        query={query}
        extra={
          <>
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
            <label className="text-sm">
              <span className="mb-1 block text-muted">Platform Role</span>
              <select
                name="role"
                defaultValue={role}
                className="rounded-md border border-line px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                {catalog.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.label_ko}
                  </option>
                ))}
              </select>
            </label>
          </>
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
            {result.rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-muted">
                  등록된 사용자가 없습니다.
                </td>
              </tr>
            ) : (
              result.rows.map((row) => (
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
                  <td className="py-2 pr-3">
                    <AdminStatusBadge status={row.status} />
                  </td>
                  <td className="py-2 pr-3">{formatWhen(row.created_at)}</td>
                  <td className="py-2 pr-3">확인 필요</td>
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
