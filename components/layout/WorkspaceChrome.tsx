import { WorkspaceHeader, type WorkspaceNavItem } from "@/components/layout/WorkspaceHeader";
import { EnvNotice } from "@/components/system/EnvNotice";
import { requireWorkspace } from "@/lib/auth/require-workspace";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { buyerNav, expertNav, internalNav, sellerNav } from "@/lib/workspace/nav";
import type { WorkspaceKind } from "@/lib/auth/workspace-router";

const navByWorkspace: Record<WorkspaceKind, WorkspaceNavItem[]> = {
  seller: sellerNav,
  buyer: buyerNav,
  expert: expertNav,
  internal: internalNav,
};

const roleLabel: Record<WorkspaceKind, string> = {
  seller: "Seller 워크스페이스",
  buyer: "Buyer 워크스페이스",
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

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-foreground">
      <WorkspaceHeader
        roleLabel={roleLabel[workspace]}
        nav={navByWorkspace[workspace]}
        signedIn={Boolean(context)}
        userName={context?.user.displayName}
        companyName={context?.company?.name}
        platformRoles={context?.platformRoles ?? []}
        currentRole={context?.platformRole ?? null}
      />
      {!configured ? (
        <div className="mx-auto max-w-6xl px-5 pt-4 sm:px-8">
          <EnvNotice />
        </div>
      ) : null}
      {children}
    </div>
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
        TODO: {note} 가짜 거래 데이터는 표시하지 않습니다.
      </p>
    </main>
  );
}
