import Link from "next/link";
import { getCurrentContext } from "@/lib/auth/session";
import { resolvePostAuthPath } from "@/lib/auth/workspace-router";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function UnauthorizedPage() {
  const context = isSupabaseConfigured() ? await getCurrentContext() : null;
  const home = context ? resolvePostAuthPath(context) : "/login";

  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <p className="text-[11px] tracking-[0.18em] text-navy">403</p>
      <h1 className="mt-2 text-2xl font-semibold">접근 권한이 없습니다</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        관리자 영역은 Platform Super Admin만 사용할 수 있습니다. 이메일만으로 권한이
        생기지 않습니다.
      </p>
      <Link href={home} className="mt-8 inline-flex text-sm text-navy underline">
        {context ? "내 워크스페이스로" : "로그인"}
      </Link>
    </main>
  );
}
