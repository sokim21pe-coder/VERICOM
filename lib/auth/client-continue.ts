import { authQuery, parseTomIntent } from "@/lib/tom/paths";

export function afterAuthHref(
  redirectTo: string | undefined,
  next: string | null,
  intent: string | null,
): string {
  return redirectTo || `/login${authQuery(next, parseTomIntent(intent))}`;
}

/** 세션 쿠키가 다음 문서 요청에 실리도록 client navigation 대신 전체 이동한다. */
export function assignAfterAuth(
  redirectTo: string | undefined,
  next: string | null,
  intent: string | null,
) {
  window.location.assign(afterAuthHref(redirectTo, next, intent));
}
