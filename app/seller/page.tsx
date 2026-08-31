import Link from "next/link";
import { SellerHomeView } from "@/components/workspace/WorkspaceHomeSections";
import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loadSellerHomeModel } from "@/lib/workspace/load-home";

export const dynamic = "force-dynamic";

export default async function SellerPage() {
  const configured = isSupabaseConfigured();
  const context = configured ? await getCurrentContext() : null;
  const model = context ? await loadSellerHomeModel(context) : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">S04</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        매각 워크스페이스
      </h1>
      {model ? (
        <>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            {model.contextView.userName}님의 매각 홈입니다. 저장된 내용만
            보여 드리며, 없는 숫자는 만들지 않습니다.
          </p>
          <SellerHomeView model={model} />
        </>
      ) : (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          로그인 후 회사와 매각 역할을 연결하면 상담·재무·가치평가 상태를 볼 수
          있습니다.
          {!configured ? (
            <>
              {" "}
              <Link href="/login" className="text-navy underline">
                로그인
              </Link>
            </>
          ) : null}
        </p>
      )}
    </main>
  );
}
