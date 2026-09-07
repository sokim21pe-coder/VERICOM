import {
  BUYER_WORKFLOW,
  MA_WORKFLOW_DISCLAIMER,
  SELLER_WORKFLOW,
  type MaWorkflowStep,
} from "@/lib/landing/ma-workflow";

function WorkflowSide({
  side,
  steps,
  detailed,
}: {
  side: string;
  steps: MaWorkflowStep[];
  detailed: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-navy">
          {side}
        </h3>
        <span className="text-xs text-muted">{steps.length}단계</span>
      </div>
      <ol
        className={
          detailed
            ? "mt-4 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2"
            : "mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3"
        }
      >
        {steps.map((step, index) => (
          <li key={step.label} className="flex gap-3 border-t border-line pt-3">
            <span className="shrink-0 pt-0.5 font-mono text-xs text-navy">
              {String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <p className="break-keep text-sm font-medium leading-6 text-foreground">
                {step.label}
              </p>
              {detailed ? (
                <p className="mt-1 break-keep text-[13px] leading-6 text-muted">
                  {step.desc}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function MaWorkflow({
  variant = "compact",
}: {
  variant?: "compact" | "detailed";
}) {
  const detailed = variant === "detailed";
  return (
    <div>
      <div className={detailed ? "space-y-12" : "space-y-10"}>
        <WorkflowSide side="매각 측" steps={SELLER_WORKFLOW} detailed={detailed} />
        <WorkflowSide side="인수 측" steps={BUYER_WORKFLOW} detailed={detailed} />
      </div>
      <p className="mt-10 max-w-3xl break-keep rounded-lg border border-line bg-surface-subtle px-5 py-4 text-sm leading-7 text-muted">
        {MA_WORKFLOW_DISCLAIMER}
      </p>
    </div>
  );
}
