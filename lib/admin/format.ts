import { SELLER_WORKFLOW_STAGES } from "@/lib/deal/standard-workflow";
import { platformRoleLabel } from "@/lib/workspace/visibility";
import { PlatformRole } from "@/types/enums";

export function formatWhen(value: string | null | undefined): string {
  if (!value) return "확인 필요";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "확인 필요";
  return date.toLocaleString("ko-KR");
}

export function sellerStageLabel(key: string | null | undefined): string {
  if (!key || key === "UNSET") return "미확정";
  const found = SELLER_WORKFLOW_STAGES.find((item) => item.key === key);
  return found ? found.label : key;
}

export function roleLabels(roles: string[] | null | undefined): string {
  if (!roles?.length) return "없음";
  return roles
    .map((role) =>
      platformRoleLabel(
        (Object.values(PlatformRole) as string[]).includes(role)
          ? (role as PlatformRole)
          : null,
      ),
    )
    .join(", ");
}

export function kpiOrUnknown(value: number | null): string {
  return value == null ? "확인 필요" : String(value);
}

export function companyVerificationLabel(value: string | null | undefined): string {
  if (value === "unverified") return "미확인";
  if (value === "pending") return "검토 중";
  if (value === "verified") return "확인됨";
  return value || "확인 필요";
}

export function companyStatusLabel(value: string | null | undefined): string {
  if (value === "draft") return "초안";
  if (value === "active") return "활성";
  if (value === "inactive") return "비활성";
  return value || "확인 필요";
}

export function teaserStatusLabel(value: string | null | undefined): string {
  if (value === "DRAFT") return "초안";
  if (value === "IN_REVIEW") return "검토 중";
  if (value === "APPROVED") return "승인";
  return value || "확인 필요";
}

export function tomIntentLabel(value: string | null | undefined): string {
  if (value === "sell") return "매각(sell)";
  if (value === "buy") return "인수(buy)";
  return value || "확인 필요";
}

export function valuationStatusLabel(value: string | null | undefined): string {
  if (value === "APPROVED") return "승인";
  if (value === "TEST_ONLY") return "테스트 전용";
  if (value === "UNVERIFIED") return "미확인";
  return value || "확인 필요";
}
