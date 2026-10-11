import Link from "next/link";
import { notFound } from "next/navigation";
import { loadAdminUser } from "@/lib/admin/data";
import { formatWhen, roleLabels } from "@/lib/admin/format";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await loadAdminUser(id);
  if (!row?.id) notFound();
  const memberships = Array.isArray(row.memberships) ? row.memberships : [];

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <p className="text-[11px] tracking-[0.18em] text-navy">A02</p>
      <h1 className="mt-2 text-2xl font-semibold">{String(row.display_name)}</h1>
      <p className="mt-3 text-sm text-muted">메타데이터만 표시합니다. 역할 변경 UI는 없습니다.</p>
      <dl className="mt-6 space-y-2 text-sm">
        <div>이메일: {String(row.email)}</div>
        <div>상태: {String(row.status)}</div>
        <div>Platform Role: {roleLabels(row.platform_roles as string[])}</div>
        <div>생성: {formatWhen(String(row.created_at))}</div>
        <div>Last Login: 확인 필요</div>
      </dl>
      <h2 className="mt-8 text-sm font-semibold">회사 Membership</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {memberships.length === 0 ? <li>없음</li> : null}
        {memberships.map((item) => {
          const m = item as Record<string, string>;
          return (
            <li key={`${m.company_id}-${m.membership_role}`}>
              {m.company_name} · {m.membership_role} · {m.status}
            </li>
          );
        })}
      </ul>
      <Link href="/admin/users" className="mt-8 inline-flex text-sm text-navy underline">
        목록으로
      </Link>
    </main>
  );
}
