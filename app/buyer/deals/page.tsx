import { ContextStrip } from "@/components/workspace/WorkspaceHomeSections";
import { getCurrentContext } from "@/lib/auth/session";
import { dealRoleLabel, platformRoleLabel } from "@/lib/workspace/visibility";

export const dynamic = "force-dynamic";

export default async function BuyerDealsPage() {
  const context = await getCurrentContext();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">B04</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        거래
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
        Opportunity와 Matching Engine은 준비 전입니다. 추천 Deal이나 진행률을
        만들지 않습니다.
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
      <dl className="mt-10 space-y-3 text-sm">
        <div className="flex justify-between gap-4 border-b border-line pb-2">
          <dt className="text-muted">현재 단계</dt>
          <dd className="text-foreground">
            {context?.deal ? "현재 단계" : "아직 시작 전"}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-b border-line pb-2">
          <dt className="text-muted">Matching</dt>
          <dd className="text-foreground">Matching Engine 준비 전</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">향후 기능</dt>
          <dd className="text-foreground">추천 Deal · NDA · IM</dd>
        </div>
      </dl>
    </main>
  );
}
