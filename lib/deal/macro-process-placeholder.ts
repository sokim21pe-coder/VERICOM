import {
  MacroMaProcessStage,
  MacroStageStatus,
} from "@/types/enums";
import type { MacroProcessSnapshot } from "@/lib/deal/macro-process";

/**
 * UI 미리보기용 PLACEHOLDER.
 * TODO: Deal / Opportunity / Task / Approval을 서버에서 읽어 채운다.
 * 실제 거래 상태를 확정하지 않는다.
 */
export const PLACEHOLDER_MACRO_PROCESS: MacroProcessSnapshot = {
  currentStageId: MacroMaProcessStage.TEASER_L1,
  stages: [
    {
      id: MacroMaProcessStage.TEASER_L1,
      status: MacroStageStatus.IN_PROGRESS,
      progressPercent: null,
      ownerName: null,
      waitingLabel: "승인 대기",
      requiredDocuments: ["회사 기본정보", "최근 3개년 재무"],
      pendingApprovals: ["TEASER_APPROVED"],
      openTasks: ["LEVEL 1 입력 항목 확인"],
      tomNextAction:
        "회사·재무 정보를 보완한 뒤 Teaser 초안을 검토하세요. Outreach는 Teaser 승인 전에는 실행하지 않습니다.",
    },
    {
      id: MacroMaProcessStage.NDA,
      status: MacroStageStatus.NOT_STARTED,
      progressPercent: null,
      ownerName: null,
      waitingLabel: null,
      requiredDocuments: ["NDA Draft"],
      pendingApprovals: ["BUYER_CONTACT_APPROVED"],
      openTasks: [],
      tomNextAction:
        "Buyer 관심 표시 후 Seller의 접촉 승인과 NDA를 진행하세요. NDA 완료만으로 회사명·IM은 공개되지 않습니다.",
    },
    {
      id: MacroMaProcessStage.ADVISORY_L2,
      status: MacroStageStatus.NOT_STARTED,
      progressPercent: null,
      ownerName: null,
      waitingLabel: null,
      requiredDocuments: ["매각자문 제안서", "Teaser Report"],
      pendingApprovals: [],
      openTasks: [],
      tomNextAction:
        "LEVEL 2 평가는 확정 배수·숫자를 AI가 만들지 않습니다. TODO: 평가 엔진 연결.",
    },
    {
      id: MacroMaProcessStage.MANDATE,
      status: MacroStageStatus.NOT_STARTED,
      progressPercent: null,
      ownerName: null,
      waitingLabel: null,
      requiredDocuments: ["Mandate 계약 Draft"],
      pendingApprovals: [],
      openTasks: [],
      tomNextAction:
        "서명 이벤트 없이 Mandate 체결로 표시하지 않습니다. 유효한 Execution Authority 전에 외부 접촉을 실행하지 않습니다.",
    },
    {
      id: MacroMaProcessStage.CIM_IM,
      status: MacroStageStatus.NOT_STARTED,
      progressPercent: null,
      ownerName: null,
      waitingLabel: null,
      requiredDocuments: ["Digital IM"],
      pendingApprovals: ["IM_RELEASE_APPROVAL"],
      openTasks: [],
      tomNextAction:
        "IM은 NDA 완료와 IM 공개 승인을 모두 충족한 Buyer만 열람합니다. VIEW와 DOWNLOAD는 분리합니다.",
    },
    {
      id: MacroMaProcessStage.LOI,
      status: MacroStageStatus.NOT_STARTED,
      progressPercent: null,
      ownerName: null,
      waitingLabel: null,
      requiredDocuments: ["LOI"],
      pendingApprovals: [],
      openTasks: [],
      tomNextAction:
        "문서 이벤트 없이 LOI를 Signed로 확정하지 않습니다. TODO: 복수 Buyer LOI 비교.",
    },
    {
      id: MacroMaProcessStage.DD,
      status: MacroStageStatus.NOT_STARTED,
      progressPercent: null,
      ownerName: null,
      waitingLabel: null,
      requiredDocuments: ["VDR", "DD Request List"],
      pendingApprovals: [],
      openTasks: [],
      tomNextAction:
        "FDD / LDD / TAX DD / CDD를 병렬 Workstream으로 둡니다. 최종 전문판단은 전문가가 검증합니다.",
    },
    {
      id: MacroMaProcessStage.SPA,
      status: MacroStageStatus.NOT_STARTED,
      progressPercent: null,
      ownerName: null,
      waitingLabel: null,
      requiredDocuments: ["SPA Draft"],
      pendingApprovals: [],
      openTasks: [],
      tomNextAction:
        "계약 내용과 체결 상태를 AI가 확정하지 않습니다. TODO: Finding ↔ SPA Issue 연결.",
    },
    {
      id: MacroMaProcessStage.CLOSING,
      status: MacroStageStatus.NOT_STARTED,
      progressPercent: null,
      ownerName: null,
      waitingLabel: null,
      requiredDocuments: ["Closing Checklist"],
      pendingApprovals: [],
      openTasks: [],
      tomNextAction:
        "실제 Closing Event 확인 전에는 거래 완료로 안내하지 않습니다.",
    },
    {
      id: MacroMaProcessStage.PMI,
      status: MacroStageStatus.NOT_STARTED,
      progressPercent: null,
      ownerName: null,
      waitingLabel: null,
      requiredDocuments: ["PMI Plan"],
      pendingApprovals: [],
      openTasks: [],
      tomNextAction:
        "PMI는 Closing 이후 확장 모듈입니다. TODO: Day 1 / 30 / 100 계획 연결.",
    },
  ],
};
