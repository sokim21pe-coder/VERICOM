"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "./BrandLogo";
import {
  LANDING_BUY_HREF,
  LANDING_EXPERT_HREF,
  LANDING_GUIDE_HREF,
  LANDING_SELL_HREF,
} from "@/lib/landing/service-pages";

const nav = [
  { href: "/#service", label: "서비스 소개" },
  { href: LANDING_SELL_HREF, label: "기업 매각" },
  { href: LANDING_BUY_HREF, label: "기업 인수" },
  { href: LANDING_EXPERT_HREF, label: "전문가" },
  { href: LANDING_GUIDE_HREF, label: "이용안내" },
];

export function Header({
  signedIn = false,
  workspaceHref = "/seller",
}: {
  signedIn?: boolean;
  workspaceHref?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#E4E7EC] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
      <div className="mx-auto flex h-[4.5rem] w-full max-w-[1200px] items-center justify-between gap-6 px-6 sm:px-8 lg:h-[5.25rem] lg:px-10">
        <Link
          href="/#top"
          className="flex shrink-0 items-center bg-[#FFFFFF]"
          aria-label="베리컴 홈"
        >
          <BrandLogo className="h-12 sm:h-[3.4rem]" priority />
        </Link>
        <nav
          aria-label="주요 메뉴"
          className="hidden items-center gap-8 text-[13px] font-medium tracking-wide text-[#475467] lg:flex xl:gap-10"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[#101828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              {item.label}
            </Link>
          ))}
          {signedIn ? (
            <Link
              href={workspaceHref}
              className="transition-colors hover:text-[#101828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              워크스페이스
            </Link>
          ) : (
            <Link
              href="/login"
              className="transition-colors hover:text-[#101828] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              로그인
            </Link>
          )}
          {signedIn ? null : (
            <Link
              href="/signup"
              className="inline-flex h-9 items-center rounded-md bg-navy px-4 text-[13px] font-semibold text-white transition-colors hover:bg-navy-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy"
            >
              회원가입
            </Link>
          )}
        </nav>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-foreground lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "메뉴 닫기" : "메뉴 열기"}</span>
          <span aria-hidden="true" className="flex flex-col gap-1.5">
            <span
              className={`h-px w-4 bg-current transition ${open ? "translate-y-1 rotate-45" : ""}`}
            />
            <span className={`h-px w-4 bg-current ${open ? "opacity-0" : ""}`} />
            <span
              className={`h-px w-4 bg-current transition ${open ? "-translate-y-1 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>
      {open ? (
        <nav
          id="mobile-nav"
          aria-label="모바일 메뉴"
          className="flex flex-col border-t border-line bg-[#FFFFFF] px-6 py-3 sm:px-8 lg:hidden"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-3 text-[15px] text-foreground"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {signedIn ? (
            <Link
              href={workspaceHref}
              className="py-3 text-[15px] text-foreground"
              onClick={() => setOpen(false)}
            >
              워크스페이스
            </Link>
          ) : (
            <Link
              href="/login"
              className="py-3 text-[15px] text-foreground"
              onClick={() => setOpen(false)}
            >
              로그인
            </Link>
          )}
          {signedIn ? null : (
            <Link
              href="/signup"
              className="mt-2 mb-1 inline-flex h-11 items-center justify-center rounded-md bg-navy text-sm font-semibold text-white"
              onClick={() => setOpen(false)}
            >
              회원가입
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  );
}
