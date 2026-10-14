import Link from "next/link";
import { AdminPager, AdminSearchForm } from "@/components/admin/AdminSearchForm";
import { loadAdminCompanies } from "@/lib/admin/data";
import {
  companyStatusLabel,
  companyVerificationLabel,
  formatWhen,
} from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; verification?: string; offset?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const verification = params.verification?.trim() ?? "";
  const offset = Number(params.offset ?? 0) || 0;
  const result = await loadAdminCompanies({ query, verification, offset, limit: 20 });
  const qs = new URLSearchParams();
  if (query) qs.set("q", query);
  if (verification) qs.set("verification", verification);
  const href = `/admin/companies${qs.toString() ? `?${qs}` : ""}`;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <p className="text-[11px] tracking-[0.18em] text-navy">A03</p>
      <h1 className="mt-2 text-2xl font-semibold">회사</h1>
      <p className="mt-3 text-sm text-muted">
        Company는 중립 객체입니다. Seller/Buyer Type은 표시하지 않습니다.
      </p>
      {result.message ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {result.message}
        </p>
      ) : null}
      <AdminSearchForm
        action="/admin/companies"
        query={query}
        extra={
          <label className="text-sm">
            <span className="mb-1 block text-muted">확인 상태</span>
            <select
              name="verification"
              defaultValue={verification}
              className="rounded-md border border-line px-3 py-2 text-sm"
            >
              <option value="">전체</option>
              <option value="unverified">미확인</option>
              <option value="pending">검토 중</option>
              <option value="verified">확인됨</option>
            </select>
          </label>
        }
      />
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-2 pr-3">회사명</th>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Owner</th>
              <th className="py-2 pr-3">Members</th>
              <th className="py-2 pr-3">Deals</th>
              <th className="py-2 pr-3">확인</th>
              <th className="py-2 pr-3">상태</th>
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
                </td>
                <td className="py-2 pr-3">중립</td>
                <td className="py-2 pr-3">{row.owner_name ?? "확인 필요"}</td>
                <td className="py-2 pr-3">{row.member_count}</td>
                <td className="py-2 pr-3">{row.deal_count}</td>
                <td className="py-2 pr-3">{companyVerificationLabel(row.verification_status)}</td>
                <td className="py-2 pr-3">{companyStatusLabel(row.company_status)}</td>
                <td className="py-2 pr-3">{formatWhen(row.last_activity_at)}</td>
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
