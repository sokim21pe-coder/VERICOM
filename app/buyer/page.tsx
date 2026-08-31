import Link from "next/link";
import { BuyerHomeView } from "@/components/workspace/WorkspaceHomeSections";
import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loadBuyerHomeModel } from "@/lib/workspace/load-home";

export const dynamic = "force-dynamic";

export default async function BuyerPage() {
  const configured = isSupabaseConfigured();
  const context = configured ? await getCurrentContext() : null;
  const model = context ? await loadBuyerHomeModel(context) : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">B01</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        인수 워크스페이스
      </h1>
      {model ? (
        <>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            {model.contextView.userName}님의 인수 홈입니다. 인수조건만 정리하며
            추천 회사는 아직 보여 드리지 않습니다.
          </p>
          <BuyerHomeView model={model} />
        </>
      ) : (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          로그인 후 회사와 인수 역할을 연결하면 상담·인수조건을 볼 수 있습니다.
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
