import type { CurrentContext } from "@/types/context";

/** Permission은 Current Context(서버)만 본다. 쿼리스트링으로 올리지 않는다. */
export function hasDealPermission(
  context: CurrentContext,
  code: string,
): boolean {
  return context.permissions.includes(code);
}
