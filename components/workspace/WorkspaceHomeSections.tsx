"use client";

import Link from "next/link";
import type {
  BuyerHomeModel,
  SellerHomeModel,
  TomHomeView,
  WorkspaceContextView,
} from "@/lib/workspace/load-home";
import type { NextAction, VisibleField } from "@/lib/workspace/visibility";

export function ContextStrip({ view }: { view: WorkspaceContextView }) {
  return (
    <dl className="mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-xs text-muted">회사</dt>
        <dd className="mt-1 text-foreground">
          {view.companyName}
          {view.companyIndustry ? ` · ${view.companyIndustry}` : ""}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted">플랫폼 역할</dt>
        <dd className="mt-1 text-foreground">{view.platformRole}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Active Deal</dt>
        <dd className="mt-1 text-foreground">{view.dealTitle}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted">Deal 역할</dt>
        <dd className="mt-1 text-foreground">{view.dealRole}</dd>
      </div>
    </dl>
  );
}

export function FieldRows({ fields }: { fields: VisibleField[] }) {
  return (
    <dl className="mt-4 space-y-3 text-sm">
      {fields.map((field) => (
        <div
          key={field.id}
          className="flex items-baseline justify-between gap-4 border-b border-line pb-2 last:border-b-0"
        >
          <dt className="text-muted">{field.label}</dt>
          <dd className="text-right text-foreground">
            <span>{field.presence}</span>
            {field.value ? (
              <span className="mt-0.5 block text-xs leading-5 text-muted">
                {field.value}
              </span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function NextActionBlock({ action }: { action: NextAction }) {
  return (
    <div className="mt-6">
      <p className="text-xs text-muted">다음 할 일</p>
      <p className="mt-1 text-sm leading-6 text-foreground">{action.detail}</p>
      <Link
        href={action.href}
        className="mt-3 inline-flex h-11 items-center rounded-md bg-navy px-5 text-sm font-medium text-white hover:bg-navy-hover"
      >
        {action.label}
      </Link>
    </div>
  );
}

export function TomHomeBlock({
  tom,
  startLabel,
  continueLabel,
}: {
  tom: TomHomeView;
  startLabel: string;
  continueLabel: string;
}) {
  return (
    <section className="mt-12 border-t border-line pt-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">TOM</p>
      <h2 className="mt-2 text-lg font-semibold text-foreground">상담</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{tom.purpose}</p>
      <p className="mt-3 text-sm text-foreground">
        {tom.started ? "상담이 이어지고 있습니다." : "아직 상담을 시작하지 않았습니다."}
      </p>
      {tom.recentTom ? (
        <p className="mt-3 text-sm leading-6 text-foreground">
          최근 안내: {tom.recentTom}
        </p>
      ) : null}
      {tom.recentUser ? (
        <p className="mt-2 text-sm leading-6 text-muted">최근 답변: {tom.recentUser}</p>
      ) : null}
      {tom.nextQuestion ? (
        <p className="mt-3 text-sm leading-6 text-foreground">
          다음 질문: {tom.nextQuestion}
        </p>
      ) : null}
      {tom.collected.length ? (
        <div className="mt-4">
          <p className="text-xs text-muted">최근 저장된 내용</p>
          <FieldRows fields={tom.collected} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted">저장된 상담 내용이 없습니다.</p>
      )}
      <Link
        href={tom.consultHref}
        className="mt-5 inline-flex text-sm text-navy underline"
      >
        {tom.started ? continueLabel : startLabel}
      </Link>
    </section>
  );
}

export function SellerHomeView({ model }: { model: SellerHomeModel }) {
  return (
    <>
      <ContextStrip view={model.contextView} />
      <NextActionBlock action={model.nextAction} />
      <TomHomeBlock
        tom={model.tom}
        startLabel="TOM 상담 시작"
        continueLabel="TOM 상담 이어가기"
      />

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-lg font-semibold text-foreground">매각 Discovery</h2>
        <p className="mt-2 text-sm text-muted">
          TOM 상담에서 받은 내용입니다. 없는 항목은 추정하지 않습니다.
        </p>
        <FieldRows fields={model.discovery} />
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-lg font-semibold text-foreground">재무 입력</h2>
        <p className="mt-2 text-sm text-muted">정규화 상태: {model.financial.status}</p>
        {model.financial.industry ? (
          <p className="mt-2 text-sm text-foreground">업종 {model.financial.industry}</p>
        ) : null}
        <FieldRows
          fields={[
            {
              id: "revenue",
              label: "매출",
              presence: model.financial.revenue.presence,
              value: model.financial.revenue.value,
            },
            {
              id: "ebitda",
              label: "EBITDA",
              presence: model.financial.ebitda.presence,
              value: model.financial.ebitda.value,
            },
            {
              id: "operating_profit",
              label: "영업이익",
              presence: model.financial.operatingProfit.presence,
              value: model.financial.operatingProfit.value,
            },
            {
              id: "net_debt",
              label: "순차입",
              presence: model.financial.netDebt.presence,
              value: model.financial.netDebt.value,
            },
          ]}
        />
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-lg font-semibold text-foreground">가치평가</h2>
        <p className="mt-2 text-sm text-muted">{model.valuation.statusLabel}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground">
          {model.valuation.copy}
        </p>
        <Link
          href="/seller/valuation"
          className="mt-4 inline-flex text-sm text-navy underline"
        >
          가치평가 상세
        </Link>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-lg font-semibold text-foreground">비공개 자료</h2>
        <p className="mt-2 text-sm text-muted">{model.documents.status}</p>
        <p className="mt-1 text-sm text-foreground">
          {model.documents.count == null
            ? "파일 목록을 불러오지 못했습니다."
            : `${model.documents.count}개 파일`}
        </p>
        <Link
          href={model.documents.href}
          className="mt-4 inline-flex text-sm text-navy underline"
        >
          자료실 열기
        </Link>
      </section>
    </>
  );
}

export function BuyerHomeView({ model }: { model: BuyerHomeModel }) {
  return (
    <>
      <ContextStrip view={model.contextView} />
      <NextActionBlock action={model.nextAction} />
      <TomHomeBlock
        tom={model.tom}
        startLabel="TOM 상담 시작"
        continueLabel="TOM 상담 이어가기"
      />

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-lg font-semibold text-foreground">인수조건</h2>
        <p className="mt-2 text-sm text-muted">
          상담에서 받은 조건입니다. 없는 항목은 추정하지 않습니다.
        </p>
        <FieldRows fields={model.criteriaFields} />
        <Link
          href="/buyer/criteria"
          className="mt-4 inline-flex text-sm text-navy underline"
        >
          정규화된 인수조건 보기
        </Link>
      </section>

      <section className="mt-8">
        <h3 className="text-sm font-medium text-foreground">정규화 요약</h3>
        <FieldRows fields={model.normalizedRows} />
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-lg font-semibold text-foreground">Matching</h2>
        <p className="mt-2 text-sm text-muted">{model.matching.statusLabel}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground">
          {model.matching.copy}
        </p>
      </section>
    </>
  );
}

export function PreparingMain({
  screenId,
  title,
  note,
}: {
  screenId: string;
  title: string;
  note: string;
}) {
  return (
    <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">{screenId}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{note}</p>
    </main>
  );
}
