import { PlatformRole } from "@/types/enums";

/** CurrentContext 구조를 바꾸지 않고 Role 배열만 검사한다. */
export function isPlatformSuperAdmin(roles: PlatformRole[] | null | undefined): boolean {
  return (roles ?? []).includes(PlatformRole.PLATFORM_SUPER_ADMIN);
}
