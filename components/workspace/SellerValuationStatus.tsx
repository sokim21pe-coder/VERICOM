import type { SellerLevel0Presentation } from "@/lib/valuation/seller-level0-presentation";

export function SellerValuationStatus({
  valuation,
  compact = false,
}: {
  valuation: SellerLevel0Presentation;
  compact?: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-muted">{valuation.statusLabel}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground">
        {valuation.copy}
      </p>
      {compact ? null : (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          {valuation.methodExplanation}
        </p>
      )}
      {valuation.showEnterpriseValue ? (
        <dl className="mt-6 max-w-xl space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-muted">평가방식</dt>
            <dd className="text-foreground">{valuation.methodLabel}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-muted">기업가치(EV) 범위</dt>
            <dd className="text-foreground">{valuation.evRangeLabel}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-muted">기준</dt>
            <dd className="text-foreground">{valuation.sourceLabel}</dd>
          </div>
        </dl>
      ) : null}
      {valuation.showEnterpriseValue && valuation.equityCopy ? (
        <p className="mt-4 max-w-2xl text-sm leading-6 text-foreground">
          {valuation.equityCopy}
        </p>
      ) : null}
      <p className="mt-4 max-w-2xl text-xs leading-5 text-muted">
        {valuation.levelLabel}. {valuation.disclaimer}
      </p>
    </div>
  );
}
