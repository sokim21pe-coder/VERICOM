/**
 * VERICOM 기본 표준 M&A 거래진행흐름 (랜딩 표시용).
 *
 * 순서·라벨·설명의 Source of Truth는 `lib/deal/standard-workflow.ts` 이다.
 * 이 파일은 landing/서비스소개 UI가 사용하는 표시용 뷰(label/desc)만 파생한다.
 * 순서를 임의로 변경/추가/삭제하지 않는다.
 */

import {
  BUYER_WORKFLOW_STAGES,
  SELLER_WORKFLOW_STAGES,
  type WorkflowStageKey,
} from "@/lib/deal/standard-workflow";

export type MaWorkflowStep = {
  /** 표준 Workflow의 안정 stage key (`lib/deal/standard-workflow.ts`). */
  key: WorkflowStageKey;
  label: string;
  desc: string;
};

export const MA_WORKFLOW_TITLE = "M&A 거래진행흐름";
export const MA_WORKFLOW_LEAD =
  "매각 측과 인수 측의 기본적인 M&A 거래진행흐름입니다.";

export const MA_WORKFLOW_DISCLAIMER =
  "위 거래진행흐름은 VERICOM이 사용하는 기본적인 표준 절차입니다. 실제 M&A 거래에서는 거래구조, 협상 방식, 경쟁매각 여부, 당사자 간 합의 및 거래 특성에 따라 일부 단계가 생략되거나 순서가 조정될 수 있습니다.";

export const SELLER_WORKFLOW: MaWorkflowStep[] = SELLER_WORKFLOW_STAGES.map(
  (stage) => ({ key: stage.key, label: stage.label, desc: stage.description }),
);

export const BUYER_WORKFLOW: MaWorkflowStep[] = BUYER_WORKFLOW_STAGES.map(
  (stage) => ({ key: stage.key, label: stage.label, desc: stage.description }),
);
