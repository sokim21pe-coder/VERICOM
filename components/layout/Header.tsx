"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandLogo } from "./BrandLogo";

const nav = [
  { href: "/#service", label: "서비스 소개" },
  { href: "/#sell", label: "기업 매각" },
  { href: "/#buy", label: "기업 인수" },
  { href: "/#expert", label: "전문가" },
  { href: "/#guide", label: "이용안내" },
];

export function Header({ signedIn = false }: { signedIn?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[#FFFFFF]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8 lg:py-4">
        <Link
          href="/#top"
          className="shrink-0 bg-[#FFFFFF]"
          aria-label="베리컴 홈"
        >
          <BrandLogo className="h-10 sm:h-12" priority />
        </Link>
        <nav
          aria-label="주요 메뉴"
          className="hidden items-center gap-8 text-[13px] tracking-wide text-muted lg:flex"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {signedIn ? (
            <Link
              href="/seller"
              className="transition-colors hover:text-foreground"
            >
              워크스페이스
            </Link>
          ) : (
            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              로그인
            </Link>
          )}
          {signedIn ? null : (
            <Link
              href="/signup"
              className="inline-flex h-10 items-center rounded-md border border-line px-4 text-[13px] font-medium text-foreground hover:border-navy"
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
          className="flex flex-col border-t border-line bg-[#FFFFFF] px-5 py-3 sm:px-8 lg:hidden"
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
              href="/seller"
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
              className="mt-2 mb-1 inline-flex h-11 items-center justify-center rounded-md border border-line text-sm font-medium text-foreground"
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
