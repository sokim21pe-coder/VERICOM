import { loadAdminDashboardKpis } from "@/lib/admin/data";
import { kpiOrUnknown, sellerStageLabel } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const kpis = await loadAdminDashboardKpis();
  const teaserDraft = kpis.teasersByStatus.DRAFT ?? 0;
  const teaserReview = kpis.teasersByStatus.IN_REVIEW ?? 0;
  const teaserApproved = kpis.teasersByStatus.APPROVED ?? 0;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <p className="text-[11px] tracking-[0.18em] text-navy">A01</p>
      <h1 className="mt-2 text-2xl font-semibold">관리자 Dashboard</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        실제 DB에서 읽은 운영 지표만 표시합니다. 회사 영구 Type, 없는 Deal 상태,
        Last Login, Suspended는 만들지 않습니다.
      </p>
      {kpis.message ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {kpis.message}
        </p>
      ) : null}

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="전체 사용자" value={kpiOrUnknown(kpis.totalUsers)} />
        <Kpi label="활성 사용자" value={kpiOrUnknown(kpis.activeUsers)} />
        <Kpi label="전체 회사" value={kpiOrUnknown(kpis.totalCompanies)} />
        <Kpi label="전체 Deal" value={kpiOrUnknown(kpis.totalDeals)} />
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-md border border-line p-4">
          <h2 className="text-sm font-semibold">Seller Stage별 Deal</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {Object.keys(kpis.dealsBySellerStage).length === 0 ? (
              <li className="text-muted">확인 필요</li>
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
          <h2 className="text-sm font-semibold">티저(Teaser) 상태</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between">
              <span>초안(DRAFT)</span>
              <span>{kpis.storageReady ? teaserDraft : "확인 필요"}</span>
            </li>
            <li className="flex justify-between">
              <span>검토 중(IN_REVIEW)</span>
              <span>{kpis.storageReady ? teaserReview : "확인 필요"}</span>
            </li>
            <li className="flex justify-between">
              <span>승인(APPROVED)</span>
              <span>{kpis.storageReady ? teaserApproved : "확인 필요"}</span>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
