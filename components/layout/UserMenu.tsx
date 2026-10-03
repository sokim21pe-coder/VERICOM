"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/lib/auth/actions";

export function UserMenu({
  name,
  email,
  initials,
  roleLabel,
}: {
  name: string;
  email: string | null;
  initials: string;
  roleLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function onLogout() {
    setPending(true);
    const result = await signOutAction();
    setPending(false);
    setOpen(false);
    router.push(result.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="사용자 메뉴"
        className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 text-left hover:bg-[#F4F6F9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:pr-2"
      >
        <span
          aria-hidden
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white"
        >
          {initials}
        </span>
        <span className="hidden min-w-0 leading-tight sm:block">
          <span className="block truncate text-sm font-medium text-foreground">
            {name}
          </span>
          {email ? (
            <span className="block truncate text-xs text-muted">{email}</span>
          ) : null}
        </span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={`hidden h-4 w-4 text-muted transition-transform sm:block ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-60 rounded-lg border border-line bg-white py-2 shadow-lg"
        >
          <div className="border-b border-line px-4 pb-3 pt-1">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            {email ? (
              <p className="truncate text-xs text-muted">{email}</p>
            ) : null}
            <p className="mt-1 text-xs text-muted">{roleLabel}</p>
          </div>
          <Link
            href="/account/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-foreground hover:bg-[#F4F6F9]"
          >
            내 프로필
          </Link>
          <Link
            href="/account/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-foreground hover:bg-[#F4F6F9]"
          >
            계정 설정
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            disabled={pending}
            className="block w-full px-4 py-2 text-left text-sm text-navy hover:bg-[#F4F6F9] disabled:opacity-60"
          >
            {pending ? "로그아웃 중…" : "로그아웃"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
