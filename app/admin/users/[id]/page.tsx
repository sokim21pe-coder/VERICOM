import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { AdminUserOperations } from "@/components/admin/AdminUserOperations";
import { loadAdminPlatformRoles, loadAdminUser } from "@/lib/admin/data";
import { formatWhen, roleLabels } from "@/lib/admin/format";
import {
  evaluateDisableUser,
  mapAdminRpcError,
} from "@/lib/admin/operations";
import { requireSuperAdmin } from "@/lib/admin/guard";
import { recordAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await requireSuperAdmin();
  const { id } = await params;
  const [row, catalog] = await Promise.all([loadAdminUser(id), loadAdminPlatformRoles()]);
  if (!row?.id) notFound();

  const roles = Array.isArray(row.platform_roles)
    ? (row.platform_roles as string[])
    : [];
  const memberships = Array.isArray(row.memberships) ? row.memberships : [];
  const recentAudit = Array.isArray(row.recent_audit) ? row.recent_audit : [];
  const status = String(row.status ?? "active");
  const actorUserId = context?.user.id ?? "";
  const activeSuperAdminCount = Number(row.active_super_admin_count ?? 0);
  const disableCheck = evaluateDisableUser({
    actorUserId,
    targetUserId: String(row.id),
    targetStatus: status,
    targetRoles: roles,
    activeSuperAdminCount,
  });

  await recordAudit({
    action: "ADMIN_USER_VIEWED",
    entityType: "user",
    entityId: String(row.id),
    metadata: {
      target_user_id: String(row.id),
      target_email: String(row.email ?? ""),
    },
  });

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <p className="text-[11px] tracking-[0.18em] text-navy">A02</p>
      <h1 className="mt-2 text-2xl font-semibold">{String(row.display_name)}</h1>
      <p className="mt-3 text-sm text-muted">
        Platform Role과 계정 상태만 변경합니다. Company / Deal Role은 변경하지 않습니다.
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Identity</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>이름: {String(row.display_name)}</div>
          <div>이메일: {String(row.email)}</div>
          <div className="flex items-center gap-2">
            상태: <AdminStatusBadge status={status} />
          </div>
          <div>사용자 ID: {String(row.id)}</div>
          <div>Auth 연결: {row.auth_linked === false ? "없음" : "연결됨"}</div>
          <div>생성: {formatWhen(String(row.created_at))}</div>
          <div>
            Last Login:{" "}
            {row.last_sign_in_at ? formatWhen(String(row.last_sign_in_at)) : "확인 필요"}
          </div>
          <div>Platform Role: {roleLabels(roles)}</div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold">Company Memberships</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {memberships.length === 0 ? <li>없음</li> : null}
          {memberships.map((item) => {
            const m = item as Record<string, string>;
            return (
              <li key={`${m.company_id}-${m.membership_role}`}>
                {m.company_id ? (
                  <Link href={`/admin/companies/${m.company_id}`} className="text-navy underline">
                    {m.company_name}
                  </Link>
                ) : (
                  m.company_name
                )}{" "}
                · {m.membership_role} · {m.status}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8">
        <AdminUserOperations
          userId={String(row.id)}
          email={String(row.email)}
          status={status}
          roles={roles}
          catalog={catalog}
          canDisable={disableCheck.ok}
          disableBlockedReason={
            disableCheck.ok ? null : mapAdminRpcError(disableCheck.code)
          }
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

      <Link href="/admin/users" className="mt-8 inline-flex text-sm text-navy underline">
        목록으로
      </Link>
    </main>
  );
}
