"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { UserMenu } from "@/components/layout/UserMenu";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import type { AdminNavGroup } from "@/lib/admin/nav";
import type { PlatformRole } from "@/types/enums";

export function AdminShell({
  nav,
  user,
  platformRoles,
  currentRole,
  children,
}: {
  nav: AdminNavGroup[];
  user: { name: string; email: string | null; initials: string; roleLabel: string };
  platformRoles: PlatformRole[];
  currentRole: PlatformRole | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-foreground">
      <header className="sticky top-0 z-30 border-b border-line bg-[#FFFFFF]">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="메뉴 열기"
              className="-ml-1 inline-flex h-10 w-10 items-center justify-center rounded-md lg:hidden"
            >
              <span className="sr-only">메뉴</span>
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <Link href="/admin/dashboard" aria-label="관리자 홈">
              <BrandLogo className="h-9" priority />
            </Link>
            <div>
              <p className="text-[11px] tracking-[0.16em] text-navy">VERICOM</p>
              <p className="text-sm font-semibold">SUPER ADMIN</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <WorkspaceSwitcher roles={platformRoles} current={currentRole} />
            <UserMenu
              name={user.name}
              email={user.email}
              initials={user.initials}
              roleLabel={user.roleLabel}
            />
          </div>
        </div>
      </header>
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden border-r border-line lg:block">
          <AdminNavList nav={nav} pathname={pathname} />
        </aside>
        <div>{children}</div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
          />
          <div className="relative h-full w-72 bg-white p-4 shadow-lg">
            <p className="text-sm font-semibold">VERICOM ADMIN</p>
            <AdminNavList nav={nav} pathname={pathname} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdminNavList({
  nav,
  pathname,
}: {
  nav: AdminNavGroup[];
  pathname: string;
}) {
  return (
    <nav className="space-y-5 px-4 py-6 text-sm">
      {nav.map((group) => (
        <div key={group.title}>
          <p className="text-[11px] tracking-[0.14em] text-muted">{group.title}</p>
          <ul className="mt-2 space-y-1">
            {group.items.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              if (item.comingSoon) {
                return (
                  <li key={item.href}>
                    <span className="flex items-center justify-between rounded-md px-2 py-1.5 text-muted">
                      {item.label}
                      <span className="text-[10px]">준비 중</span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-md px-2 py-1.5 ${
                      active ? "bg-[#F4F6F9] font-medium text-navy" : "text-foreground hover:bg-[#F4F6F9]"
                    }`}
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
