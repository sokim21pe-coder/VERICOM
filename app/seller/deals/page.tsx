import { ContextStrip } from "@/components/workspace/WorkspaceHomeSections";
import { SellerStagePanel } from "@/components/deal/SellerStagePanel";
import { getCurrentContext } from "@/lib/auth/session";
import { canContextTransitionSellerStage } from "@/lib/deal/seller-stage-transition";
import {
  EMPTY_SELLER_STAGE,
  readSellerDealStage,
} from "@/lib/deal/seller-stage-read";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dealRoleLabel, platformRoleLabel } from "@/lib/workspace/visibility";

export const dynamic = "force-dynamic";

export default async function SellerDealsPage() {
  const context = await getCurrentContext();

  let stage = EMPTY_SELLER_STAGE;
  if (context?.deal) {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      stage = await readSellerDealStage(supabase, context.deal.id);
    }
  }
  const canWriteStage = context?.deal
    ? canContextTransitionSellerStage(context, context.deal.id)
    : false;

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">S06</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        거래
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Opportunity·NDA(비밀유지계약)·IM(투자설명서) 거래 엔진은 아직 연결하지
        않았습니다. 완료된 단계처럼 보이지 않습니다.
      </p>
      {context ? (
        <ContextStrip
          view={{
            userName: context.user.displayName,
            companyName: context.company?.name ?? "미연결",
            companyIndustry: context.company?.industry ?? null,
            platformRole: platformRoleLabel(context.platformRole),
            dealTitle: context.deal?.title?.trim() || (context.deal ? "제목 없음" : "미선택"),
            dealRole: dealRoleLabel(context.dealRole),
          }}
        />
      ) : null}
      {context?.deal ? (
        <SellerStagePanel
          currentLabel={stage.label}
          currentStageKey={stage.stageKey}
          canWrite={canWriteStage}
        />
      ) : (
        <p className="mt-8 max-w-xl rounded-lg border border-line bg-surface-subtle px-5 py-4 text-sm leading-6 text-muted">
          거래를 선택하면 현재 거래 단계를 확인할 수 있습니다.
        </p>
      )}
      <dl className="mt-10 space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-line pb-2">
          <dt className="text-muted">거래 엔진</dt>
          <dd className="text-foreground">준비 중</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">향후 기능</dt>
          <dd className="text-foreground">NDA · IM · Q&A · LOI</dd>
        </div>
      </dl>
    </main>
  );
}
