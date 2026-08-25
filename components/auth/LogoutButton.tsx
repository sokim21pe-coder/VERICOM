"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/lib/auth/actions";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    const result = await signOutAction();
    setPending(false);
    router.push(result.redirectTo ?? "/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-sm text-navy underline disabled:opacity-60"
    >
      {pending ? "로그아웃 중…" : "로그아웃"}
    </button>
  );
}
