import Link from "next/link";
import { AdminPager, AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { loadAdminCompaniesV12 } from "@/lib/admin/company-data";
import { formatWhen } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

const verificationLabels: Record<string, string> = {
  unverified: "미확인",
  pending: "검토 중",
  verified: "확인 완료",
};

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; verification?: string; offset?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const verification = params.verification?.trim() ?? "";
  const offset = Number(params.offset ?? 0) || 0;
  const result = await loadAdminCompaniesV12({ query, verification, offset, limit: 20 });
  const search = new URLSearchParams();
  if (query) search.set("q", query);
  if (verification) search.set("verification", verification);
  const href = search.size ? `/admin/companies?${search.toString()}` : "/admin/companies";

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <p className="text-[11px] tracking-[0.18em] text-navy">A03</p>
      <h1 className="mt-2 text-2xl font-semibold">회사 관리</h1>
      <p className="mt-3 text-sm text-muted">
        Company는 중립 객체입니다. Seller/Buyer 영구 Type은 만들지 않습니다.
      </p>
      {result.message ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {result.message}
        </p>
      ) : null}

      <AdminSearchForm action="/admin/companies" query={query} />
      <form action="/admin/companies" className="mt-3 flex flex-wrap items-end gap-3">
        <input type="hidden" name="q" value={query} />
        <label className="text-sm">
          <span className="mb-1 block text-muted">Verification</span>
          <select
            name="verification"
            defaultValue={verification}
            className="rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="">전체</option>
            <option value="unverified">미확인</option>
            <option value="pending">검토 중</option>
            <option value="verified">확인 완료</option>
          </select>
        </label>
        <button className="rounded-md border border-line px-3 py-2 text-sm" type="submit">
          필터 적용
        </button>
      </form>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3">회사명</th>
              <th className="py-2 pr-3">대표/Owner</th>
              <th className="py-2 pr-3">Members</th>
              <th className="py-2 pr-3">Deals</th>
              <th className="py-2 pr-3">상태</th>
              <th className="py-2 pr-3">Verification</th>
              <th className="py-2 pr-3">최근 활동</th>
              <th className="py-2 pr-3">생성</th>
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row) => (
              <tr key={row.id} className="border-b border-line">
                <td className="py-2 pr-3">
                  <Link href={`/admin/companies/${row.id}`} className="text-navy underline">
                    {row.name}
                  </Link>
                  {row.legal_name && row.legal_name !== row.name ? (
                    <div className="text-xs text-muted">{row.legal_name}</div>
                  ) : null}
                  {row.business_registration_number ? (
                    <div className="text-xs text-muted">{row.business_registration_number}</div>
                  ) : null}
                </td>
                <td className="py-2 pr-3">{row.owner_name ?? "확인 필요"}</td>
                <td className="py-2 pr-3">{row.member_count}</td>
                <td className="py-2 pr-3">{row.deal_count}</td>
                <td className="py-2 pr-3">{row.company_status}</td>
                <td className="py-2 pr-3">{verificationLabels[row.verification_status] ?? row.verification_status}</td>
                <td className="py-2 pr-3">{row.last_activity_at ? formatWhen(row.last_activity_at) : "확인 필요"}</td>
                <td className="py-2 pr-3">{formatWhen(row.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AdminPager href={href} total={result.total} limit={result.limit} offset={result.offset} />
    </main>
  );
}
