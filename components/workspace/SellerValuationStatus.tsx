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
      {valuation.progressLabel ? (
        <p className="mt-1 text-xs text-navy">진행상태: {valuation.progressLabel}</p>
      ) : null}
      {valuation.flowSteps && valuation.flowSteps.length > 0 ? (
        <ol className="mt-3 flex flex-wrap gap-2 text-xs">
          {valuation.flowSteps.map((step) => (
            <li
              key={step.id}
              className={
                step.state === "done"
                  ? "text-foreground"
                  : step.state === "current"
                    ? "font-medium text-navy"
                    : "text-muted"
              }
            >
              {step.label}
              {step.state === "current" ? " (현재)" : step.state === "done" ? " (완료)" : ""}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground">
        {compact ? valuation.tomExplanation : valuation.copy}
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
          {valuation.multipleLowLabel ||
          valuation.multipleBaseLabel ||
          valuation.multipleHighLabel ? (
            <div className="flex justify-between gap-4 border-b border-line py-2">
              <dt className="text-muted">비교배수 Low / Base / High</dt>
              <dd className="text-foreground">
                {[
                  valuation.multipleLowLabel ?? "미입력",
                  valuation.multipleBaseLabel ?? "미입력",
                  valuation.multipleHighLabel ?? "미입력",
                ].join(" · ")}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-muted">기업가치(EV) 범위</dt>
            <dd className="text-foreground">{valuation.evRangeLabel}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-line py-2">
            <dt className="text-muted">기준</dt>
            <dd className="text-foreground">{valuation.sourceLabel}</dd>
          </div>
        </dl>
      ) : valuation.methodLabel ? (
        <p className="mt-4 text-sm text-foreground">평가방식: {valuation.methodLabel}</p>
      ) : null}
      {valuation.showEnterpriseValue && valuation.equityCopy ? (
        <p className="mt-4 max-w-2xl text-sm leading-6 text-foreground">
          {valuation.equityCopy}
        </p>
      ) : null}
      {valuation.missingItems && valuation.missingItems.length > 0 ? (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          부족 항목: {valuation.missingItems.join(", ")}
        </p>
      ) : null}
      <p className="mt-4 max-w-2xl text-xs leading-5 text-muted">
        {valuation.levelLabel}. {valuation.disclaimer}
      </p>
    </div>
  );
}
