import Link from "next/link";
import { AdminPage } from "@/components/admin/AdminPage";
import { requireSuperAdmin } from "@/lib/admin/guard";
import { loadAdminDashboardKpis } from "@/lib/admin/data";
import { formatWhen, kpiOrUnknown, roleLabels, sellerStageLabel } from "@/lib/admin/format";
import { resolveUserName } from "@/lib/workspace/user-display";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [kpis, context] = await Promise.all([
    loadAdminDashboardKpis(),
    requireSuperAdmin(),
  ]);
  const teaserDraft = kpis.teasersByStatus.DRAFT ?? 0;
  const teaserReview = kpis.teasersByStatus.IN_REVIEW ?? 0;
  const teaserApproved = kpis.teasersByStatus.APPROVED ?? 0;
  const name = resolveUserName({
    displayName: context?.user.displayName,
    email: context?.user.email,
  });

  return (
    <AdminPage
      screenId="A01"
      title={`안녕하세요, ${name}`}
      description="실제 DB에서 읽은 운영 지표만 표시합니다. 회사 영구 Type, 없는 Deal 상태, Last Login, Suspended는 만들지 않습니다."
      crumbs={[{ label: "Dashboard" }]}
      notice={kpis.message}
    >
      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="전체 사용자" value={kpiOrUnknown(kpis.totalUsers)} href="/admin/users" />
        <Kpi label="활성 사용자" value={kpiOrUnknown(kpis.activeUsers)} href="/admin/users?status=active" />
        <Kpi label="전체 회사" value={kpiOrUnknown(kpis.totalCompanies)} href="/admin/companies" />
        <Kpi label="전체 Deal" value={kpiOrUnknown(kpis.totalDeals)} href="/admin/deals" />
        <Kpi
          label="Seller"
          value={kpiOrUnknown(kpis.storageReady ? kpis.usersByRole.SELLER_USER ?? 0 : null)}
        />
        <Kpi
          label="Buyer"
          value={kpiOrUnknown(kpis.storageReady ? kpis.usersByRole.BUYER_USER ?? 0 : null)}
        />
        <Kpi
          label="TOM 상담"
          value={kpiOrUnknown(kpis.tomConversations)}
          href="/admin/tom"
        />
        <Kpi
          label="문서(Teaser)"
          value={kpiOrUnknown(
            kpis.storageReady ? teaserDraft + teaserReview + teaserApproved : null,
          )}
          href="/admin/documents"
        />
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-2">
        <div className="rounded-md border border-line p-4">
          <h2 className="text-sm font-semibold">Seller Stage별 Deal</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.keys(kpis.dealsBySellerStage).length === 0 ? (
              <li className="text-muted">등록된 Deal이 없습니다.</li>
            ) : (
              Object.entries(kpis.dealsBySellerStage).map(([key, count]) => (
                <li key={key} className="flex justify-between">
                  <span>{sellerStageLabel(key)}</span>
                  <span>{count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-md border border-line p-4">
          <h2 className="text-sm font-semibold">문서·가치평가</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between">
              <span>티저(Teaser) 초안</span>
              <span>{kpis.storageReady ? teaserDraft : "확인 필요"}</span>
            </li>
            <li className="flex justify-between">
              <span>티저 검토 중</span>
              <span>{kpis.storageReady ? teaserReview : "확인 필요"}</span>
            </li>
            <li className="flex justify-between">
              <span>티저 승인</span>
              <span>{kpis.storageReady ? teaserApproved : "확인 필요"}</span>
            </li>
            <li className="flex justify-between">
              <span>승인 비교배수 기록</span>
              <span>{kpiOrUnknown(kpis.valuationBenchmarks)}</span>
            </li>
            <li className="flex justify-between">
              <span>진행 TOM 상담</span>
              <span>{kpiOrUnknown(kpis.tomActive)}</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-10 grid gap-6 xl:grid-cols-3">
        <RecentCard title="최근 가입 회원" empty="최근 가입 회원이 없습니다.">
          {kpis.recentUsers.map((item) => (
            <li key={item.id}>
              <Link href={`/admin/users/${item.id}`} className="block hover:text-navy">
                <span className="font-medium">{item.display_name || item.email}</span>
                <span className="mt-0.5 block text-xs text-muted">{formatWhen(item.created_at)}</span>
              </Link>
            </li>
          ))}
        </RecentCard>
        <RecentCard title="최근 Deal" empty="최근 Deal이 없습니다.">
          {kpis.recentDeals.map((item) => (
            <li key={item.id}>
              <Link href={`/admin/deals/${item.id}`} className="block hover:text-navy">
                <span className="font-medium">{item.title || "제목 없음"}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {sellerStageLabel(item.seller_stage_key)} · {formatWhen(item.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </RecentCard>
        <RecentCard title="최근 관리자 작업" empty="최근 관리자 작업이 없습니다.">
          {kpis.recentAdminActions.map((item) => (
            <li key={item.id}>
              <Link href="/admin/audit-logs" className="block hover:text-navy">
                <span className="font-medium">{item.action}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {item.actor_email || "확인 필요"} · {formatWhen(item.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </RecentCard>
      </section>

      {Object.keys(kpis.usersByRole).length > 0 ? (
        <p className="mt-8 text-xs text-muted">
          역할 분포: {roleLabels(Object.keys(kpis.usersByRole))}
        </p>
      ) : null}
    </AdminPage>
  );
}

function Kpi({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <div className="rounded-md border border-line px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function RecentCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  return (
    <div className="rounded-md border border-line p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-3 space-y-3 text-sm">{children}</ul>
      )}
    </div>
  );
}
