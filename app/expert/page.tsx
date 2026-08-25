import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function ExpertPage() {
  const context = isSupabaseConfigured() ? await getCurrentContext() : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">E01</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        전문가 홈
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        {context
          ? `${context.user.displayName}님의 전문가 워크스페이스입니다. 배정 Deal·Workstream은 TODO입니다.`
          : "로그인 후 전문가 워크스페이스를 이용할 수 있습니다."}
      </p>
    </main>
  );
}
