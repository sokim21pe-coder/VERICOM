import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { EnvNotice } from "@/components/system/EnvNotice";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { requireSuperAdmin } from "@/lib/admin/guard";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { workspacePathForRole } from "@/lib/auth/workspace-router";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { adminHeaderIdentity } from "@/lib/admin/header";
import { initialsFrom } from "@/lib/workspace/user-display";
import { PlatformRole } from "@/types/enums";

export async function AdminChrome({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const context = await requireSuperAdmin();

  if (!context) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-foreground">
        <header className="border-b border-line bg-[#FFFFFF]">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link href="/" aria-label="베리컴 홈">
              <BrandLogo className="h-9" priority />
            </Link>
            <Link href="/login?next=/admin/dashboard" className="text-sm text-navy underline">
              로그인
            </Link>
          </div>
        </header>
        {!configured ? (
          <div className="mx-auto max-w-6xl px-5 pt-4">
            <EnvNotice />
          </div>
        ) : null}
        {children}
      </div>
    );
  }

  const header = adminHeaderIdentity({
    displayName: context.user.displayName,
    email: context.user.email,
    platformRole: context.platformRole,
  });

  const otherRole = context.platformRoles.find(
    (role) => role !== PlatformRole.PLATFORM_SUPER_ADMIN,
  );

  return (
    <AdminShell
      nav={ADMIN_NAV}
      user={{
        name: header.name,
        email: header.email,
        initials: initialsFrom(header.name),
        roleLabel: header.roleLabel,
      }}
      platformRoles={context.platformRoles}
      currentRole={context.platformRole}
      userHomeHref={otherRole ? workspacePathForRole(otherRole) : "/"}
    >
      {children}
    </AdminShell>
  );
}
