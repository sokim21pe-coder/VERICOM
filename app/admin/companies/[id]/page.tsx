import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAdminCompany } from "@/lib/admin/data";
import { formatWhen } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await loadAdminCompany(id);
  if (!row?.id) notFound();
  const members = Array.isArray(row.members) ? row.members : [];

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <p className="text-[11px] tracking-[0.18em] text-navy">A03</p>
      <h1 className="mt-2 text-2xl font-semibold">{String(row.name)}</h1>
      <p className="mt-3 text-sm text-muted">회사 Type은 없습니다. 멤버 메타데이터만 표시합니다.</p>
      <dl className="mt-6 space-y-2 text-sm">
        <div>업종: {row.industry ? String(row.industry) : "확인 필요"}</div>
        <div>상태: {String(row.company_status)}</div>
        <div>확인: {String(row.verification_status)}</div>
        <div>구성원: {String(row.member_count)}</div>
        <div>Deal: {String(row.deal_count)}</div>
        <div>생성: {formatWhen(String(row.created_at))}</div>
      </dl>
      <h2 className="mt-8 text-sm font-semibold">구성원</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {members.length === 0 ? <li>없음</li> : null}
        {members.map((item) => {
          const m = item as Record<string, string>;
          return (
            <li key={`${m.user_id}-${m.membership_role}`}>
              {m.display_name} · {m.membership_role} · {m.status}
            </li>
          );
        })}
      </ul>
      <Link href="/admin/companies" className="mt-8 inline-flex text-sm text-navy underline">
        목록으로
      </Link>
    </main>
  );
}
