import { PlatformRole } from "@/types/enums";

export const ACCOUNT_DISABLED_PATH = "/account-disabled";

export const ACCOUNT_DISABLED_MESSAGE =
  "이 계정은 현재 사용이 중지되어 있습니다. VERICOM 관리자에게 문의해 주세요.";

export const SUPER_ADMIN_CONFIRM_TEXT = "SUPER ADMIN 권한 부여";

export const ADMIN_REASON_TYPES = [
  { value: "SECURITY", label: "보안 이상" },
  { value: "USER_REQUEST", label: "사용자 요청" },
  { value: "CONTRACT_ENDED", label: "계약 종료" },
  { value: "TEST_ACCOUNT", label: "테스트 계정" },
  { value: "POLICY", label: "운영자 판단" },
  { value: "OTHER", label: "기타" },
] as const;

export type AdminReasonType = (typeof ADMIN_REASON_TYPES)[number]["value"];

export const SENSITIVE_PLATFORM_ROLES: PlatformRole[] = [
  PlatformRole.INTERNAL_DEAL_MANAGER,
  PlatformRole.ADMIN,
  PlatformRole.PLATFORM_SUPER_ADMIN,
];

export function isAccountDisabled(status: string | null | undefined): boolean {
  return status === "disabled";
}

export function isDisabledBlockedPath(pathname: string): boolean {
  if (pathname === ACCOUNT_DISABLED_PATH) return false;
  return (
    pathname.startsWith("/seller") ||
    pathname.startsWith("/buyer") ||
    pathname.startsWith("/expert") ||
    pathname.startsWith("/internal") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/consult")
  );
}

export function isSensitivePlatformRole(role: string): boolean {
  return SENSITIVE_PLATFORM_ROLES.includes(role as PlatformRole);
}

export function evaluateDisableUser(input: {
  actorUserId: string;
  targetUserId: string;
  targetStatus: string;
  targetRoles: string[];
  activeSuperAdminCount: number;
}): { ok: true } | { ok: false; code: string } {
  if (input.targetStatus === "disabled") return { ok: false, code: "ADMIN_ALREADY_DISABLED" };
  if (input.actorUserId === input.targetUserId) return { ok: false, code: "ADMIN_SELF_DISABLE" };
  if (
    input.targetRoles.includes(PlatformRole.PLATFORM_SUPER_ADMIN) &&
    input.activeSuperAdminCount <= 1
  ) {
    return { ok: false, code: "ADMIN_LAST_SUPER_ADMIN" };
  }
  return { ok: true };
}

export function evaluateEnableUser(input: {
  targetStatus: string;
}): { ok: true } | { ok: false; code: string } {
  if (input.targetStatus === "active") return { ok: false, code: "ADMIN_ALREADY_ACTIVE" };
  return { ok: true };
}

export function evaluateAddPlatformRole(input: {
  role: string;
  existingRoles: string[];
  catalog: string[];
  confirm?: string | null;
}): { ok: true } | { ok: false; code: string } {
  if (!input.catalog.includes(input.role)) return { ok: false, code: "ADMIN_INVALID_ROLE" };
  if (input.existingRoles.includes(input.role)) return { ok: false, code: "ADMIN_ALREADY_HAS_ROLE" };
  if (
    input.role === PlatformRole.PLATFORM_SUPER_ADMIN &&
    (input.confirm ?? "").trim() !== SUPER_ADMIN_CONFIRM_TEXT
  ) {
    return { ok: false, code: "ADMIN_CONFIRM_REQUIRED" };
  }
  return { ok: true };
}

export function evaluateRemovePlatformRole(input: {
  actorUserId: string;
  targetUserId: string;
  role: string;
  existingRoles: string[];
  catalog: string[];
  targetStatus: string;
  activeSuperAdminCount: number;
}): { ok: true } | { ok: false; code: string } {
  if (!input.catalog.includes(input.role)) return { ok: false, code: "ADMIN_INVALID_ROLE" };
  if (!input.existingRoles.includes(input.role)) return { ok: false, code: "ADMIN_ROLE_NOT_FOUND" };
  if (input.role === PlatformRole.PLATFORM_SUPER_ADMIN) {
    if (input.actorUserId === input.targetUserId) {
      return { ok: false, code: "ADMIN_SELF_REMOVE_SUPER" };
    }
    if (input.targetStatus === "active" && input.activeSuperAdminCount <= 1) {
      return { ok: false, code: "ADMIN_LAST_SUPER_ADMIN" };
    }
  }
  return { ok: true };
}

export function mapAdminRpcError(message: string | null | undefined): string {
  const text = message ?? "";
  if (text.includes("ADMIN_LAST_SUPER_ADMIN") || text.includes("platform super admin required")) {
    if (text.includes("not permitted")) return "이 작업을 수행할 권한이 없습니다.";
  }
  if (text.includes("not permitted")) return "이 작업을 수행할 권한이 없습니다.";
  if (text.includes("ADMIN_LAST_SUPER_ADMIN")) {
    return "최소 1명의 활성 최고 관리자가 필요합니다.";
  }
  if (text.includes("ADMIN_SELF_DISABLE")) return "자기 계정은 정지할 수 없습니다.";
  if (text.includes("ADMIN_SELF_REMOVE_SUPER")) {
    return "자기 자신의 최고 관리자 권한은 제거할 수 없습니다.";
  }
  if (text.includes("ADMIN_ALREADY_HAS_ROLE")) return "이미 부여된 권한입니다.";
  if (text.includes("ADMIN_ROLE_NOT_FOUND")) return "해당 권한이 없습니다.";
  if (text.includes("ADMIN_INVALID_ROLE")) return "존재하지 않는 권한입니다.";
  if (text.includes("ADMIN_ALREADY_DISABLED")) return "현재 사용자는 이미 정지 상태입니다.";
  if (text.includes("ADMIN_ALREADY_ACTIVE")) return "현재 사용자는 이미 활성 상태입니다.";
  if (text.includes("ADMIN_USER_NOT_FOUND")) return "사용자를 찾을 수 없습니다.";
  if (text.includes("ADMIN_REASON_REQUIRED")) return "사유를 입력해 주세요.";
  if (text.includes("ADMIN_CONFIRM_REQUIRED")) {
    return "확인 문구를 정확히 입력해 주세요.";
  }
  if (text.includes("ADMIN_INVALID_STATUS")) return "허용되지 않은 계정 상태입니다.";
  return "요청을 처리하지 못했습니다.";
}

export function adminStaffStillInternalOnly(roles: string[]): boolean {
  return (
    roles.includes(PlatformRole.ADMIN) &&
    !roles.includes(PlatformRole.PLATFORM_SUPER_ADMIN)
  );
}
