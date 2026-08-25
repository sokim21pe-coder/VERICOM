import {
  DealStage,
  MacroMaProcessStage,
  MacroStageStatus,
} from "@/types/enums";

export type MacroStageDefinition = {
  id: MacroMaProcessStage;
  order: number;
  label: string;
  relatedDealStages: DealStage[];
};

export const MACRO_MA_PROCESS: MacroStageDefinition[] = [
  {
    id: MacroMaProcessStage.TEASER_L1,
    order: 1,
    label: "티저·LEVEL 1 가치평가",
    relatedDealStages: [
      DealStage.DISCOVERY,
      DealStage.VALUATION,
      DealStage.PREPARATION,
      DealStage.TEASER,
    ],
  },
  {
    id: MacroMaProcessStage.NDA,
    order: 2,
    label: "NDA",
    relatedDealStages: [DealStage.OUTREACH, DealStage.NDA],
  },
  {
    id: MacroMaProcessStage.ADVISORY_L2,
    order: 3,
    label: "매각자문 제안·LEVEL 2 가치평가",
    relatedDealStages: [DealStage.VALUATION, DealStage.PREPARATION],
  },
  {
    id: MacroMaProcessStage.MANDATE,
    order: 4,
    label: "Mandate",
    relatedDealStages: [DealStage.PREPARATION],
  },
  {
    id: MacroMaProcessStage.CIM_IM,
    order: 5,
    label: "CIM / IM",
    relatedDealStages: [DealStage.IM],
  },
  {
    id: MacroMaProcessStage.LOI,
    order: 6,
    label: "LOI",
    relatedDealStages: [
      DealStage.MANAGEMENT_MEETING,
      DealStage.IOI,
      DealStage.LOI,
    ],
  },
  {
    id: MacroMaProcessStage.DD,
    order: 7,
    label: "DD",
    relatedDealStages: [DealStage.DD],
  },
  {
    id: MacroMaProcessStage.SPA,
    order: 8,
    label: "SPA",
    relatedDealStages: [DealStage.FINAL_NEGOTIATION, DealStage.SPA],
  },
  {
    id: MacroMaProcessStage.CLOSING,
    order: 9,
    label: "Closing",
    relatedDealStages: [DealStage.CLOSING],
  },
  {
    id: MacroMaProcessStage.PMI,
    order: 10,
    label: "PMI",
    relatedDealStages: [],
  },
];

export const MACRO_STAGE_STATUS_LABEL: Record<MacroStageStatus, string> = {
  [MacroStageStatus.NOT_STARTED]: "시작 전",
  [MacroStageStatus.IN_PROGRESS]: "진행 중",
  [MacroStageStatus.WAITING_SELLER]: "Seller 대기",
  [MacroStageStatus.WAITING_BUYER]: "Buyer 대기",
  [MacroStageStatus.WAITING_EXPERT]: "전문가 대기",
  [MacroStageStatus.WAITING_DOCUMENT]: "문서 대기",
  [MacroStageStatus.WAITING_APPROVAL]: "승인 대기",
  [MacroStageStatus.COMPLETED]: "완료",
  [MacroStageStatus.BLOCKED]: "차단",
};

export type MacroStageView = {
  id: MacroMaProcessStage;
  status: MacroStageStatus;
  progressPercent: number | null;
  ownerName: string | null;
  waitingLabel: string | null;
  requiredDocuments: string[];
  pendingApprovals: string[];
  openTasks: string[];
  tomNextAction: string;
};

export type MacroProcessSnapshot = {
  currentStageId: MacroMaProcessStage;
  stages: MacroStageView[];
};
