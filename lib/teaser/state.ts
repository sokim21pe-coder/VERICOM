import type { TeaserStatus } from "@/lib/teaser/types";

// Teaser 상태 전이. 핵심은 Draft → Review → Explicit Approval.
// 명시적 사용자 승인 없이는 APPROVED가 되지 않는다.
// 승인된 내용을 수정하면 기존 승인은 무효가 되고 다시 Review/Approval이 필요하다.

export type TeaserAction = "edit" | "submit" | "approve" | "preview";

const ALLOWED_TRANSITIONS: Record<TeaserStatus, TeaserStatus[]> = {
  DRAFT: ["IN_REVIEW"],
  IN_REVIEW: ["APPROVED", "DRAFT"],
  APPROVED: ["DRAFT"],
};

export function canTransition(from: TeaserStatus, to: TeaserStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * 내용 수정 후의 상태. 어떤 상태에서 수정하든 DRAFT로 돌아간다.
 * 특히 APPROVED를 수정하면 승인이 무효화되어 다시 검토가 필요하다.
 */
export function statusAfterEdit(): TeaserStatus {
  return "DRAFT";
}

/** 현재 상태에서 가능한 사용자 Action. */
export function actionsForStatus(status: TeaserStatus): TeaserAction[] {
  switch (status) {
    case "DRAFT":
      return ["edit", "submit", "preview"];
    case "IN_REVIEW":
      return ["edit", "approve", "preview"];
    case "APPROVED":
      return ["edit", "preview"];
    default:
      return ["preview"];
  }
}

export function canSubmitForReview(status: TeaserStatus): boolean {
  return canTransition(status, "IN_REVIEW");
}

/** 승인은 IN_REVIEW에서만 가능하다. DRAFT에서 바로 승인할 수 없다. */
export function canApprove(status: TeaserStatus): boolean {
  return canTransition(status, "APPROVED");
}

export const TEASER_STATUS_LABEL: Record<TeaserStatus, string> = {
  DRAFT: "초안",
  IN_REVIEW: "검토 중",
  APPROVED: "승인 완료",
};

/** Teaser가 없을 때(작성 전)를 포함한 표시용 라벨. */
export function teaserStageLabel(status: TeaserStatus | null): string {
  if (!status) return "작성 전";
  return TEASER_STATUS_LABEL[status];
}
