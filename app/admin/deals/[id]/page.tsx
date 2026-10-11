import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPage } from "@/components/admin/AdminPage";
import { loadAdminDeal } from "@/lib/admin/data";
import { formatWhen, sellerStageLabel } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminDealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await loadAdminDeal(id);
  if (!row?.id) notFound();

  return (
    <AdminPage
      screenId="A04"
      title={String(row.title || "제목 없음")}
      description="기밀 문서·Teaser 본문·Buyer 식별 정보는 열지 않습니다. 향후 break-glass가 필요합니다."
      crumbs={[
        { href: "/admin/deals", label: "Deals" },
        { label: String(row.title || "제목 없음") },
      ]}
    >
      <dl className="mt-6 space-y-2 text-sm">
        <div>
          Seller 회사:{" "}
          {row.seller_company_id ? (
            <Link
              href={`/admin/companies/${String(row.seller_company_id)}`}
              className="text-navy underline"
            >
              {row.seller_company_name ? String(row.seller_company_name) : "회사"}
            </Link>
          ) : row.seller_company_name ? (
            String(row.seller_company_name)
          ) : (
            "확인 필요"
          )}
        </div>
        <div>Seller Stage: {sellerStageLabel(row.seller_stage_key as string | null)}</div>
        <div>기존 status: {row.status ? String(row.status) : "확인 필요"}</div>
        <div>참여자 수: {row.participant_count != null ? String(row.participant_count) : "확인 필요"}</div>
        <div>생성: {formatWhen(String(row.created_at))}</div>
      </dl>
      <Link href="/admin/deals" className="mt-8 inline-flex text-sm text-navy underline">
        목록으로
      </Link>
    </AdminPage>
  );
}
