import Link from "next/link";
import { TeaserWorkspace } from "@/components/teaser/TeaserWorkspace";
import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loadSellerTeaserView } from "@/lib/teaser/data";

export const dynamic = "force-dynamic";

export default async function SellerTeaserPage() {
  const configured = isSupabaseConfigured();
  const context = configured ? await getCurrentContext() : null;
  const view = context ? await loadSellerTeaserView(context) : null;

  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">S05</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        티저(Teaser)
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        티저는 NDA 전에 Buyer에게 전달하는 익명·제한정보 소개자료입니다. 상담에서
        확인된 사실만으로 초안을 만들고, 직접 검토한 뒤 명시적으로 승인합니다.
        회사명·기업가치·배수는 넣지 않으며, 확인되지 않은 정보는 만들어 넣지
        않습니다. (이번 단계에서는 Buyer 배포 기능은 제공하지 않습니다.)
      </p>

      {view ? (
        <TeaserWorkspace view={view} />
      ) : (
        <p className="mt-6 max-w-2xl text-sm leading-6 text-muted">
          로그인 후 회사와 매각 역할을 연결하면 티저를 작성할 수 있습니다.
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

      <Link
        href="/consult?intent=sell"
        className="mt-8 inline-flex text-sm text-navy underline"
      >
        TOM(AI) 상담으로 기업 정보 입력
      </Link>
    </main>
  );
}
