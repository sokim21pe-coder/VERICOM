import { redirect } from "next/navigation";
import {
  ACCOUNT_DISABLED_PATH,
  isAccountDisabled,
} from "@/lib/admin/operations";
import type { CurrentContext } from "@/types/context";

export {
  ACCOUNT_DISABLED_MESSAGE,
  ACCOUNT_DISABLED_PATH,
  isDisabledBlockedPath,
} from "@/lib/admin/operations";

export function contextIsDisabled(context: CurrentContext | null | undefined): boolean {
  return isAccountDisabled(context?.user.status);
}

/** Workspace / Admin / Account 서버 가드에서 호출. 로그인 페이지는 호출하지 않는다. */
export function redirectIfAccountDisabled(
  context: CurrentContext | null | undefined,
): void {
  if (contextIsDisabled(context)) {
    redirect(ACCOUNT_DISABLED_PATH);
  }
}
