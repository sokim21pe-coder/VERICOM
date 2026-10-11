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
