import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/AdminPage";
import { AdminCompanyOperations } from "@/components/admin/AdminCompanyOperations";
import { loadAdminCompany } from "@/lib/admin/data";
import {
  companyStatusLabel,
  companyVerificationLabel,
  formatWhen,
  sellerStageLabel,
} from "@/lib/admin/format";
import { requireSuperAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSuperAdmin();
  const { id } = await params;
  const row = await loadAdminCompany(id);
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
    <AdminPage
      screenId="A03"
      title={String(row.name)}
      description="회사 Type은 없습니다. Membership 변경은 v1.3에서 다룹니다."
      crumbs={[
        { href: "/admin/companies", label: "Companies" },
        { label: String(row.name) },
      ]}
    >

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Company Overview</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>회사명: {String(row.name)}</div>
          <div>법인명: {row.legal_name ? String(row.legal_name) : "확인 필요"}</div>
          <div>
            사업자번호:{" "}
            {row.business_registration_number
              ? String(row.business_registration_number)
              : "확인 필요"}
          </div>
          <div>업종: {row.industry ? String(row.industry) : "확인 필요"}</div>
          <div>상태: {companyStatusLabel(String(row.company_status))}</div>
          <div>확인: {companyVerificationLabel(String(row.verification_status))}</div>
          <div>구성원: {String(row.member_count ?? 0)}</div>
          <div>Deal: {String(row.deal_count ?? 0)}</div>
          <div>생성: {formatWhen(String(row.created_at))}</div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Verification</h2>
        <p className="mt-2 text-sm">
          현재 값: {companyVerificationLabel(String(row.verification_status))}
        </p>
        <p className="mt-1 text-sm text-muted">
          기존 값만 사용합니다. unverified / pending / verified.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Members</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {members.length === 0 ? <li>없음</li> : null}
          {members.map((item) => {
            const m = item as Record<string, string>;
            return (
              <li key={`${m.user_id}-${m.membership_role}`}>
                <Link href={`/admin/users/${m.user_id}`} className="text-navy underline">
                  {m.display_name}
                </Link>
                {m.email ? ` · ${m.email}` : ""} · {m.membership_role} · {m.status}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Related Deals</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {deals.length === 0 ? <li>없음</li> : null}
          {deals.map((item) => {
            const d = item as Record<string, string>;
            return (
              <li key={d.id}>
                <Link href={`/admin/deals/${d.id}`} className="text-navy underline">
                  {d.title || "제목 없음"}
                </Link>
                {" · "}
                {sellerStageLabel(d.seller_stage_key)} · {d.status ?? "확인 필요"} ·{" "}
                {formatWhen(d.created_at)}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8">
        <AdminCompanyOperations
          companyId={String(row.id)}
          companyName={String(row.name)}
          verification={String(row.verification_status ?? "unverified")}
          companyStatus={String(row.company_status ?? "active")}
        />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold">Recent Audit</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {recentAudit.length === 0 ? <li className="text-muted">없음</li> : null}
          {recentAudit.map((item) => {
            const log = item as Record<string, unknown>;
            const meta = (log.metadata ?? {}) as Record<string, unknown>;
            return (
              <li key={String(log.id)}>
                {formatWhen(String(log.created_at))} · {String(log.action)} ·{" "}
                {String(log.actor_email ?? log.actor_user_id ?? "확인 필요")}
                {meta.reason_detail ? ` · ${String(meta.reason_detail)}` : ""}
              </li>
            );
          })}
        </ul>
      </section>

      <Link href="/admin/companies" className="mt-8 inline-flex text-sm text-navy underline">
        목록으로
      </Link>
    </AdminPage>
  );
}
