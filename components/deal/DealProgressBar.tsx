import { MACRO_STAGE_STATUS_LABEL } from "@/lib/deal/macro-process";
import { MacroMaProcessStage, MacroStageStatus } from "@/types/enums";
import type { MacroProcessSnapshot } from "@/lib/deal/macro-process";
import { MACRO_MA_PROCESS } from "@/lib/deal/macro-process";

type DealProgressBarProps = {
  snapshot: MacroProcessSnapshot;
  selectedId: MacroMaProcessStage;
  onSelect: (id: MacroMaProcessStage) => void;
};

export function DealProgressBar({
  snapshot,
  selectedId,
  onSelect,
}: DealProgressBarProps) {
  return (
    <ol className="-mx-1 flex gap-2 overflow-x-auto pb-2">
      {MACRO_MA_PROCESS.map((def) => {
        const view = snapshot.stages.find((item) => item.id === def.id);
        const status = view?.status ?? MacroStageStatus.NOT_STARTED;
        const isCurrent = snapshot.currentStageId === def.id;
        const isSelected = selectedId === def.id;
        const done = status === MacroStageStatus.COMPLETED;

        return (
          <li key={def.id} className="shrink-0">
            <button
              type="button"
              onClick={() => onSelect(def.id)}
              className={`min-w-[9.5rem] rounded-lg border px-3 py-3 text-left ${
                isSelected
                  ? "border-navy bg-white"
                  : "border-line bg-white"
              }`}
            >
              <p className="font-mono text-[11px] text-navy">
                {String(def.order).padStart(2, "0")}
                {isCurrent ? " · 현재" : ""}
              </p>
              <p className="mt-1 text-[13px] font-medium leading-snug text-foreground">
                {def.label}
              </p>
              <p className="mt-1.5 text-[11px] text-muted">
                {MACRO_STAGE_STATUS_LABEL[status]}
                {done ? " · 완료" : ""}
              </p>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
