import Link from "next/link";
import { SellerDealProcess } from "@/components/deal/SellerDealProcess";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentContext } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SellerPage() {
  const configured = isSupabaseConfigured();
  const context = configured ? await getCurrentContext() : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">S04 / S06</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Seller 홈
      </h1>
      {context ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          {context.user.displayName}님
          {context.company ? ` · ${context.company.name}` : ""} · 아래 10단계는
          UI 미리보기(PLACEHOLDER)입니다. 실제 가치평가·NDA·IM은 후속
          단계입니다.
        </p>
      ) : (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          아래 10단계는 UI 미리보기(PLACEHOLDER)입니다.
        </p>
      )}
      {!context && !configured ? (
        <p className="mt-2 text-sm">
          <Link href="/login" className="text-navy underline">
            로그인
          </Link>
        </p>
      ) : null}

      <div className="mt-10">
        <SellerDealProcess />
      </div>
    </main>
  );
}
