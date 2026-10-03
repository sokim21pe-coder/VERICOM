"use client";

import Link from "next/link";
import type {
  BuyerHomeModel,
  SellerHomeModel,
  TomHomeView,
  WorkspaceContextView,
} from "@/lib/workspace/load-home";
import type { NextAction, VisibleField } from "@/lib/workspace/visibility";
import { SellerValuationStatus } from "@/components/workspace/SellerValuationStatus";

export function Card({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 rounded-xl border border-line bg-white p-5 sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-foreground sm:text-lg">
      {children}
    </h2>
  );
}

export function ContextStrip({ view }: { view: WorkspaceContextView }) {
  const items = [
    {
      label: "회사",
      value:
        view.companyName +
        (view.companyIndustry ? ` · ${view.companyIndustry}` : ""),
    },
    { label: "플랫폼 역할", value: view.platformRole },
    { label: "Active Deal", value: view.dealTitle },
    { label: "Deal 역할", value: view.dealRole },
  ];
  return (
    <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-line bg-[#FBFCFE] px-4 py-3"
        >
          <dt className="text-xs text-muted">{item.label}</dt>
          <dd className="mt-1 text-sm font-medium text-foreground">
            {item.value}
          </dd>
        </div>
      ))}
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
    <section className="mt-6 rounded-xl border border-navy/15 bg-[#F1F4F9] p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-navy">
        다음 할 일
      </p>
      <p className="mt-2 text-sm leading-6 text-foreground">{action.detail}</p>
      <Link
        href={action.href}
        className="mt-4 inline-flex h-11 items-center rounded-md bg-navy px-5 text-sm font-medium text-white hover:bg-navy-hover"
      >
        {action.label}
      </Link>
    </section>
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
    <Card id="tom" className="mt-6">
      <p className="text-[11px] tracking-[0.18em] text-navy">TOM(AI)</p>
      <h2 className="mt-2 text-base font-semibold text-foreground sm:text-lg">
        상담
      </h2>
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
    </Card>
  );
}

export function SellerHomeView({ model }: { model: SellerHomeModel }) {
  return (
    <div className="mt-2 space-y-6">
      <ContextStrip view={model.contextView} />
      <NextActionBlock action={model.nextAction} />
      <TomHomeBlock
        tom={model.tom}
        startLabel="TOM(AI) 상담 시작"
        continueLabel="TOM(AI) 상담 이어가기"
      />

      <Card id="discovery">
        <SectionTitle>매각 Discovery</SectionTitle>
        <p className="mt-2 text-sm text-muted">
          TOM(AI) 상담에서 받은 내용입니다. 없는 항목은 추정하지 않습니다.
        </p>
        <FieldRows fields={model.discovery} />
      </Card>

      <Card id="financial">
        <SectionTitle>재무 입력</SectionTitle>
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
              id: "cash",
              label: "현금",
              presence: model.financial.cash.presence,
              value: model.financial.cash.value,
            },
            {
              id: "debt",
              label: "차입",
              presence: model.financial.debt.presence,
              value: model.financial.debt.value,
            },
            {
              id: "net_debt",
              label: "순차입",
              presence: model.financial.netDebt.presence,
              value: model.financial.netDebt.value,
            },
          ]}
        />
      </Card>

      <Card id="valuation">
        <SectionTitle>가치평가</SectionTitle>
        <div className="mt-4">
          <SellerValuationStatus valuation={model.valuation} compact />
        </div>
        <Link
          href="/seller/valuation"
          className="mt-4 inline-flex text-sm text-navy underline"
        >
          가치평가 상세
        </Link>
      </Card>

      <Card id="documents">
        <SectionTitle>비공개 자료</SectionTitle>
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
      </Card>
    </div>
  );
}

export function BuyerHomeView({ model }: { model: BuyerHomeModel }) {
  return (
    <div className="mt-2 space-y-6">
      <ContextStrip view={model.contextView} />
      <NextActionBlock action={model.nextAction} />
      <TomHomeBlock
        tom={model.tom}
        startLabel="TOM(AI) 상담 시작"
        continueLabel="TOM(AI) 상담 이어가기"
      />

      <Card id="criteria">
        <SectionTitle>인수조건</SectionTitle>
        <p className="mt-2 text-sm text-muted">
          상담에서 받은 조건입니다. 없는 항목은 추정하지 않습니다.
        </p>
        <FieldRows fields={model.criteriaFields} />
        <div className="mt-6">
          <h3 className="text-sm font-medium text-foreground">정규화 요약</h3>
          <FieldRows fields={model.normalizedRows} />
        </div>
        <Link
          href="/buyer/criteria"
          className="mt-4 inline-flex text-sm text-navy underline"
        >
          정규화된 인수조건 보기
        </Link>
      </Card>

      <Card id="matching">
        <SectionTitle>Matching</SectionTitle>
        <p className="mt-2 text-sm text-muted">{model.matching.statusLabel}</p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground">
          {model.matching.copy}
        </p>
      </Card>
    </div>
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
