import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminCompanyOperations } from "@/components/admin/AdminCompanyOperations";
import { loadAdminCompanyV12 } from "@/lib/admin/company-data";
import { formatWhen } from "@/lib/admin/format";
import { requireSuperAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const verificationLabels: Record<string, string> = {
  unverified: "미확인",
  pending: "검토 중",
  verified: "확인 완료",
};

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const row = await loadAdminCompanyV12(id);
  if (!row?.id) notFound();

  const members = Array.isArray(row.members) ? row.members : [];
  const deals = Array.isArray(row.deals) ? row.deals : [];
  const recentAudit = Array.isArray(row.recent_audit) ? row.recent_audit : [];

  await recordAudit({
    action: "ADMIN_COMPANY_VIEWED",
    entityType: "company",
    entityId: String(row.id),
    metadata: {
      target_company_id: String(row.id),
      target_company_name: String(row.name ?? ""),
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <p className="text-[11px] tracking-[0.18em] text-navy">A03</p>
      <h1 className="mt-2 text-2xl font-semibold">{String(row.name)}</h1>
      <p className="mt-3 text-sm text-muted">
        Company는 중립 객체입니다. Seller/Buyer 영구 Type은 사용하지 않습니다.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Company Overview</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div>법인명: {row.legal_name ? String(row.legal_name) : "확인 필요"}</div>
          <div>사업자번호: {row.business_registration_number ? String(row.business_registration_number) : "확인 필요"}</div>
          <div>업종: {row.industry ? String(row.industry) : "확인 필요"}</div>
          <div>웹사이트: {row.website ? String(row.website) : "확인 필요"}</div>
          <div>회사 상태: {String(row.company_status)}</div>
          <div>
            Verification: {verificationLabels[String(row.verification_status)] ?? String(row.verification_status)}
          </div>
          <div>활성 구성원: {String(row.member_count)}</div>
          <div>연결 Deal: {String(row.deal_count)}</div>
          <div>생성: {formatWhen(String(row.created_at))}</div>
          <div>수정: {formatWhen(String(row.updated_at))}</div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Memberships</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3">사용자</th>
                <th className="py-2 pr-3">이메일</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Verification</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={5} className="py-3 text-muted">없음</td></tr>
              ) : null}
              {members.map((item) => {
                const member = item as Record<string, unknown>;
                return (
                  <tr key={String(member.membership_id ?? `${member.user_id}-${member.membership_role}`)} className="border-b border-line">
                    <td className="py-2 pr-3">
                      <Link href={`/admin/users/${String(member.user_id)}`} className="text-navy underline">
                        {String(member.display_name ?? "확인 필요")}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{String(member.email ?? "확인 필요")}</td>
                    <td className="py-2 pr-3">{String(member.membership_role ?? "확인 필요")}</td>
                    <td className="py-2 pr-3">{String(member.status ?? "확인 필요")}</td>
                    <td className="py-2 pr-3">{String(member.verification_status ?? "확인 필요")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Related Deals</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-3">Deal</th>
                <th className="py-2 pr-3">Seller Stage</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">생성</th>
              </tr>
            </thead>
            <tbody>
              {deals.length === 0 ? (
                <tr><td colSpan={4} className="py-3 text-muted">없음</td></tr>
              ) : null}
              {deals.map((item) => {
                const deal = item as Record<string, unknown>;
                return (
                  <tr key={String(deal.id)} className="border-b border-line">
                    <td className="py-2 pr-3">
                      <Link href={`/admin/deals/${String(deal.id)}`} className="text-navy underline">
                        {String(deal.title ?? "제목 없음")}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{String(deal.seller_stage_key ?? "미확정")}</td>
                    <td className="py-2 pr-3">{String(deal.status ?? "확인 필요")}</td>
                    <td className="py-2 pr-3">{formatWhen(String(deal.created_at))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AdminCompanyOperations
        companyId={String(row.id)}
        companyName={String(row.name)}
        companyStatus={String(row.company_status)}
        verificationStatus={String(row.verification_status)}
      />

      <section className="mt-10">
        <h2 className="text-sm font-semibold">Recent Audit</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {recentAudit.length === 0 ? <li className="text-muted">없음</li> : null}
          {recentAudit.map((item) => {
            const log = item as Record<string, unknown>;
            const metadata = (log.metadata ?? {}) as Record<string, unknown>;
            return (
              <li key={String(log.id)}>
                {formatWhen(String(log.created_at))} · {String(log.action)} · {String(log.actor_email ?? log.actor_user_id ?? "확인 필요")}
                {metadata.reason_detail ? ` · ${String(metadata.reason_detail)}` : ""}
              </li>
            );
          })}
        </ul>
      </section>

      <Link href="/admin/companies" className="mt-8 inline-flex text-sm text-navy underline">
        목록으로
      </Link>
    </main>
  );
}
