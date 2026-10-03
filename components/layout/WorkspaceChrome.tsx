import Link from "next/link";
import { WorkspaceShell } from "@/components/layout/WorkspaceShell";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { EnvNotice } from "@/components/system/EnvNotice";
import { requireWorkspace } from "@/lib/auth/require-workspace";
import { listAccessibleDeals } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sidebarForWorkspace } from "@/lib/workspace/sidebar";
import { initialsFrom, resolveUserName } from "@/lib/workspace/user-display";
import type { WorkspaceKind } from "@/lib/auth/workspace-router";

const roleLabel: Record<WorkspaceKind, string> = {
  seller: "매각 워크스페이스",
  buyer: "인수 워크스페이스",
  expert: "전문가 워크스페이스",
  internal: "Internal 워크스페이스",
};

export async function WorkspaceChrome({
  workspace,
  children,
}: {
  workspace: WorkspaceKind;
  children: React.ReactNode;
}) {
  const configured = isSupabaseConfigured();
  const context = await requireWorkspace(workspace);

  if (!context) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-foreground">
        <header className="border-b border-line bg-[#FFFFFF]">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
            <Link href="/" aria-label="베리컴 홈" className="bg-[#FFFFFF]">
              <BrandLogo className="h-9 sm:h-10" priority />
            </Link>
            <Link href="/login" className="text-sm text-navy underline">
              로그인
            </Link>
          </div>
        </header>
        {!configured ? (
          <div className="mx-auto max-w-6xl px-5 pt-4 sm:px-8">
            <EnvNotice />
          </div>
        ) : null}
        {children}
      </div>
    );
  }

  const accessibleDeals = await listAccessibleDeals();
  const name = resolveUserName({
    displayName: context.user.displayName,
    email: context.user.email,
  });

  return (
    <WorkspaceShell
      roleLabel={roleLabel[workspace]}
      sidebar={sidebarForWorkspace(workspace)}
      user={{
        name,
        email: context.user.email ?? null,
        initials: initialsFrom(name),
      }}
      platformRoles={context.platformRoles}
      currentRole={context.platformRole}
      accessibleDeals={accessibleDeals}
      currentDealId={context.deal?.id ?? null}
    >
      {children}
    </WorkspaceShell>
  );
}

export function WorkspaceTodoMain({
  screenId,
  title,
  note,
}: {
  screenId: string;
  title: string;
  note: string;
}) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">{screenId}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        준비 중. {note} 가짜 거래 데이터는 표시하지 않습니다.
      </p>
    </main>
  );
}
