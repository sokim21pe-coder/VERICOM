import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import type { PlatformRole } from "@/types/enums";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  todo?: boolean;
};

const defaultSellerNav: WorkspaceNavItem[] = [
  { href: "/seller", label: "홈" },
  { href: "/seller", label: "내 회사", todo: true },
  { href: "/seller", label: "인수후보", todo: true },
  { href: "/seller", label: "진행 중 거래" },
  { href: "/seller", label: "자료실", todo: true },
  { href: "/seller", label: "전문가", todo: true },
  { href: "/seller", label: "TOM" },
];

type WorkspaceHeaderProps = {
  roleLabel: string;
  nav?: WorkspaceNavItem[];
  userName?: string | null;
  companyName?: string | null;
  signedIn?: boolean;
  platformRoles?: PlatformRole[];
  currentRole?: PlatformRole | null;
};

export function WorkspaceHeader({
  roleLabel,
  nav = defaultSellerNav,
  userName,
  companyName,
  signedIn = false,
  platformRoles = [],
  currentRole = null,
}: WorkspaceHeaderProps) {
  const accountAction = signedIn ? (
    <LogoutButton />
  ) : (
    <Link href="/login" className="text-sm text-navy underline">
      로그인
    </Link>
  );

  return (
    <header className="border-b border-line bg-[#FFFFFF]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-8 lg:flex-nowrap">
        <Link
          href="/"
          className="order-1 bg-[#FFFFFF]"
          aria-label="베리컴 홈"
        >
          <BrandLogo className="h-10 sm:h-12" priority />
        </Link>
        <div className="order-2 flex items-center gap-3 lg:order-3">
          <div className="hidden items-center gap-4 lg:flex">
            <p className="text-xs text-muted">{roleLabel}</p>
            {companyName ? (
              <p className="text-xs text-muted">{companyName}</p>
            ) : null}
            {userName ? (
              <p className="text-xs text-foreground">{userName}</p>
            ) : null}
            <WorkspaceSwitcher
              roles={platformRoles}
              current={currentRole}
            />
          </div>
          <div className="lg:hidden">
            <WorkspaceSwitcher
              roles={platformRoles}
              current={currentRole}
            />
          </div>
          {accountAction}
        </div>
        <nav
          aria-label="워크스페이스 메뉴"
          className="order-3 -mx-1 w-full overflow-x-auto text-[13px] text-muted lg:order-2 lg:w-auto"
        >
          <div className="flex gap-1">
            {nav.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="shrink-0 rounded-md px-2 py-1.5 hover:text-foreground"
                title={item.todo ? "TODO: 화면 미연결" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
