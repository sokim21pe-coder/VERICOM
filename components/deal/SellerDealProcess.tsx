"use client";

import { useMemo, useState } from "react";
import { DealProgressBar } from "@/components/deal/DealProgressBar";
import { MacroStageCard } from "@/components/deal/MacroStageCard";
import { MacroStageDetailPlaceholder } from "@/components/deal/MacroStageDetailPlaceholder";
import { TomNextBestActionCard } from "@/components/deal/TomNextBestActionCard";
import { PLACEHOLDER_MACRO_PROCESS } from "@/lib/deal/macro-process-placeholder";
import { MACRO_MA_PROCESS } from "@/lib/deal/macro-process";
import { MacroMaProcessStage } from "@/types/enums";

export function SellerDealProcess() {
  const snapshot = PLACEHOLDER_MACRO_PROCESS;
  const [selectedId, setSelectedId] = useState<MacroMaProcessStage>(
    snapshot.currentStageId,
  );

  const selected = snapshot.stages.find((item) => item.id === selectedId);
  const currentDef = MACRO_MA_PROCESS.find(
    (item) => item.id === snapshot.currentStageId,
  );
  const currentView = snapshot.stages.find(
    (item) => item.id === snapshot.currentStageId,
  );

  const tom = useMemo(() => {
    const view = currentView;
    return {
      situation:
        "PLACEHOLDER: Seller Deal이 Current Context에 아직 연결되지 않았습니다.",
      completed: "없음 · TODO: Activity에서 집계",
      issue: view?.openTasks[0] ?? "TODO: 미완료 Task 연결",
      nextAction: view?.tomNextAction ?? "TODO",
      requiredApproval: view?.pendingApprovals[0] ?? "없음",
      requiredDocument: view?.requiredDocuments.join(", ") ?? "TODO",
      expectedNext: "02 NDA (Teaser 승인 이후)",
    };
  }, [currentView]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-medium tracking-[0.18em] text-navy">
          거래 프로세스
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          표준 M&amp;A 10단계
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          거래 진행을 한눈에 보기 위한 상위 프로세스입니다. 내부 Deal Stage /
          Opportunity Stage는 그대로 유지됩니다.
        </p>
      </div>

      <DealProgressBar
        snapshot={snapshot}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {snapshot.stages.map((view) => (
          <MacroStageCard
            key={view.id}
            view={view}
            isCurrent={view.id === snapshot.currentStageId}
            isSelected={view.id === selectedId}
            onSelect={setSelectedId}
          />
        ))}
      </div>

      <TomNextBestActionCard
        currentLabel={currentDef?.label ?? "TODO"}
        situation={tom.situation}
        completed={tom.completed}
        issue={tom.issue}
        nextAction={tom.nextAction}
        requiredApproval={tom.requiredApproval}
        requiredDocument={tom.requiredDocument}
        expectedNext={tom.expectedNext}
      />

      {selected ? (
        <MacroStageDetailPlaceholder
          view={selected}
          onClose={() => setSelectedId(snapshot.currentStageId)}
        />
      ) : null}
    </div>
  );
}
