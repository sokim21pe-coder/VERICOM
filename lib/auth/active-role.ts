import { PlatformRole } from "@/types/enums";

export const ACTIVE_PLATFORM_ROLE_COOKIE = "vericom_active_platform_role";

/** 쿠키 Role은 보유 Role 안에 있을 때만 인정한다. */
export function resolveActivePlatformRole(
  cookieRole: PlatformRole | null,
  platformRoles: PlatformRole[],
): PlatformRole | null {
  if (cookieRole && platformRoles.includes(cookieRole)) return cookieRole;
  if (platformRoles.includes(PlatformRole.PLATFORM_SUPER_ADMIN)) {
    return PlatformRole.PLATFORM_SUPER_ADMIN;
  }
  return platformRoles[0] ?? null;
}
