import Link from "next/link";
import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function InternalPage() {
  const context = isSupabaseConfigured() ? await getCurrentContext() : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">I01</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Internal 홈
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        {context
          ? `${context.user.displayName}님의 Internal 영역입니다. Pipeline·Sourcing은 TODO이며, 역할이 있는 사용자만 이 화면에 들어올 수 있습니다.`
          : "로그인 후 Internal 영역을 이용할 수 있습니다."}
      </p>
      <Link
        href="/internal/benchmarks"
        className="mt-8 inline-flex text-sm text-navy underline"
      >
        승인 비교배수
      </Link>
    </main>
  );
}
