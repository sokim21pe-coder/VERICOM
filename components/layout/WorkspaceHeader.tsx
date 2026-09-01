import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { ActiveDealSwitcher } from "@/components/layout/ActiveDealSwitcher";
import type { PlatformRole } from "@/types/enums";
import type { AccessibleDeal } from "@/types/context";
import { TOM_PRODUCT_NAME } from "@/lib/brand/tom-display";

export type WorkspaceNavItem = {
  href: string;
  label: string;
  todo?: boolean;
  preparing?: boolean;
};

const defaultSellerNav: WorkspaceNavItem[] = [
  { href: "/seller", label: "홈" },
  { href: "/consult?intent=sell", label: TOM_PRODUCT_NAME },
  { href: "/seller/deals", label: "거래" },
  { href: "/seller/docs", label: "자료실" },
  { href: "/seller/valuation", label: "가치평가" },
  { href: "/seller/documents", label: "문서", preparing: true },
];

type WorkspaceHeaderProps = {
  roleLabel: string;
  nav?: WorkspaceNavItem[];
  userName?: string | null;
  companyName?: string | null;
  signedIn?: boolean;
  platformRoles?: PlatformRole[];
  currentRole?: PlatformRole | null;
  accessibleDeals?: AccessibleDeal[];
  currentDealId?: string | null;
};

export function WorkspaceHeader({
  roleLabel,
  nav = defaultSellerNav,
  userName,
  companyName,
  signedIn = false,
  platformRoles = [],
  currentRole = null,
  accessibleDeals = [],
  currentDealId = null,
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
          <p className="hidden text-xs text-muted lg:block">{roleLabel}</p>
          {companyName ? (
            <p className="hidden text-xs text-muted lg:block">{companyName}</p>
          ) : null}
          {userName ? (
            <p className="hidden text-xs text-foreground lg:block">{userName}</p>
          ) : null}
          <WorkspaceSwitcher
            roles={platformRoles}
            current={currentRole}
          />
          <ActiveDealSwitcher
            deals={accessibleDeals}
            currentDealId={currentDealId}
          />
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
                className={
                  item.preparing || item.todo
                    ? "shrink-0 rounded-md px-2 py-1.5 text-muted"
                    : "shrink-0 rounded-md px-2 py-1.5 hover:text-foreground"
                }
                title={
                  item.preparing
                    ? "준비 중"
                    : item.todo
                      ? "준비 중"
                      : undefined
                }
              >
                {item.label}
                {item.preparing ? (
                  <span className="ml-1 text-[10px] text-muted">준비 중</span>
                ) : null}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
