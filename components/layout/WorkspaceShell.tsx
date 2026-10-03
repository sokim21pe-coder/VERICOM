"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { UserMenu } from "@/components/layout/UserMenu";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { ActiveDealSwitcher } from "@/components/layout/ActiveDealSwitcher";
import { sidebarLinkPath, type SidebarGroup } from "@/lib/workspace/sidebar";
import type { PlatformRole } from "@/types/enums";
import type { AccessibleDeal } from "@/types/context";

type ShellUser = {
  name: string;
  email: string | null;
  initials: string;
};

export function WorkspaceShell({
  roleLabel,
  sidebar,
  user,
  platformRoles,
  currentRole,
  accessibleDeals,
  currentDealId,
  children,
}: {
  roleLabel: string;
  sidebar: SidebarGroup[];
  user: ShellUser;
  platformRoles: PlatformRole[];
  currentRole: PlatformRole | null;
  accessibleDeals: AccessibleDeal[];
  currentDealId: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-foreground">
      <header className="sticky top-0 z-30 border-b border-line bg-[#FFFFFF]">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="메뉴 열기"
              className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-[#F4F6F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy lg:hidden"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <Link href="/" aria-label="베리컴 홈" className="bg-[#FFFFFF]">
              <BrandLogo className="h-9 sm:h-10" priority />
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <WorkspaceSwitcher roles={platformRoles} current={currentRole} />
              <ActiveDealSwitcher
                deals={accessibleDeals}
                currentDealId={currentDealId}
              />
            </div>
            <UserMenu
              name={user.name}
              email={user.email}
              initials={user.initials}
              roleLabel={roleLabel}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1440px]">
        <aside className="hidden w-[248px] shrink-0 border-r border-line lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto px-3 py-6">
            <SidebarNav groups={sidebar} pathname={pathname} />
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-navy/40"
          />
          <div className="absolute left-0 top-0 flex h-full w-[80%] max-w-[300px] flex-col bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <BrandLogo className="h-8" />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="메뉴 닫기"
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-[#F4F6F9]"
              >
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <div className="mb-4 border-b border-line px-2 pb-4 sm:hidden">
                <WorkspaceSwitcher roles={platformRoles} current={currentRole} />
                <div className="mt-2">
                  <ActiveDealSwitcher
                    deals={accessibleDeals}
                    currentDealId={currentDealId}
                  />
                </div>
              </div>
              <SidebarNav groups={sidebar} pathname={pathname} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SidebarNav({
  groups,
  pathname,
}: {
  groups: SidebarGroup[];
  pathname: string;
}) {
  return (
    <nav aria-label="워크스페이스 메뉴" className="space-y-6">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {group.title}
          </p>
          <ul className="mt-2 space-y-0.5">
            {group.items.map((item) => {
              const base = sidebarLinkPath(item.href);
              const isActive = !item.href.includes("#") && base === pathname;
              if (item.preparing) {
                return (
                  <li key={`${item.href}-${item.label}`}>
                    <span
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-muted"
                      title="준비 중"
                    >
                      {item.label}
                      <span className="text-[10px] text-muted">준비 중</span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={`${item.href}-${item.label}`}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "flex items-center rounded-md border-l-2 border-navy bg-[#F1F4F9] px-3 py-2 text-sm font-medium text-navy"
                        : "flex items-center rounded-md border-l-2 border-transparent px-3 py-2 text-sm text-foreground hover:bg-[#F4F6F9]"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
