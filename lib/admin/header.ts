import { resolveUserName } from "@/lib/workspace/user-display";
import type { PlatformRole } from "@/types/enums";

/** Header 표시값은 Context에서만 만든다. 이메일 문자열로 관리자를 판별하지 않는다. */
export function adminHeaderIdentity(input: {
  displayName: string | null | undefined;
  email: string | null | undefined;
  platformRole: PlatformRole | null | undefined;
}) {
  return {
    name: resolveUserName({
      displayName: input.displayName,
      email: input.email,
    }),
    email: input.email ?? null,
    roleLabel: input.platformRole ?? "확인 필요",
  };
}
