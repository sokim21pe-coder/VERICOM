import { MACRO_STAGE_STATUS_LABEL } from "@/lib/deal/macro-process";
import { MacroMaProcessStage, MacroStageStatus } from "@/types/enums";
import type { MacroStageView } from "@/lib/deal/macro-process";
import { MACRO_MA_PROCESS } from "@/lib/deal/macro-process";

type MacroStageCardProps = {
  view: MacroStageView;
  isCurrent: boolean;
  isSelected: boolean;
  onSelect: (id: MacroMaProcessStage) => void;
};

export function MacroStageCard({
  view,
  isCurrent,
  isSelected,
  onSelect,
}: MacroStageCardProps) {
  const def = MACRO_MA_PROCESS.find((item) => item.id === view.id);
  if (!def) return null;

  return (
    <button
      type="button"
      onClick={() => onSelect(view.id)}
      className={`h-full w-full rounded-xl border bg-white p-4 text-left sm:p-5 ${
        isSelected ? "border-navy" : "border-line"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[11px] text-navy">
          {String(def.order).padStart(2, "0")}
        </p>
        {isCurrent ? (
          <span className="rounded-md bg-navy px-2 py-0.5 text-[11px] text-white">
            현재 단계
          </span>
        ) : null}
      </div>
      <h3 className="mt-2 text-sm font-semibold leading-snug text-foreground sm:text-base">
        {def.label}
      </h3>
      <p className="mt-2 text-xs text-muted">
        {MACRO_STAGE_STATUS_LABEL[view.status]}
      </p>
      <p className="mt-1 text-xs text-muted">
        진행률:{" "}
        {view.progressPercent === null
          ? "TODO"
          : `${view.progressPercent}%`}
      </p>
      <p className="mt-1 text-xs text-muted">
        담당자: {view.ownerName ?? "TODO"}
      </p>
      {view.status === MacroStageStatus.WAITING_APPROVAL ||
      view.waitingLabel ? (
        <p className="mt-1 text-xs text-navy">
          {view.waitingLabel ?? MACRO_STAGE_STATUS_LABEL[view.status]}
        </p>
      ) : null}
    </button>
  );
}
