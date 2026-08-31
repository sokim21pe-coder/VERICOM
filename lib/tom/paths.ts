export type TomIntent = "sell" | "buy";

export function parseTomIntent(value: string | null | undefined): TomIntent | null {
  if (value === "sell" || value === "buy") return value;
  return null;
}

export function consultPath(intent: TomIntent): string {
  return `/consult?intent=${intent}`;
}

export function parseIntentFromNext(next: string | null): TomIntent | null {
  if (!next) return null;
  try {
    const url = new URL(next, "https://vericom.local");
    return parseTomIntent(url.searchParams.get("intent"));
  } catch {
    return null;
  }
}

function isAllowedNextPath(path: string): boolean {
  return (
    path === "/consult" ||
    path === "/seller" ||
    path.startsWith("/seller/") ||
    path === "/buyer" ||
    path.startsWith("/buyer/") ||
    path === "/expert" ||
    path.startsWith("/expert/") ||
    path === "/internal" ||
    path.startsWith("/internal/") ||
    path.startsWith("/onboarding/")
  );
}

/** 열린 리다이렉트 방지. 내부 경로만 허용. */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.includes("://") || raw.includes("\\")) return null;
  const path = raw.split("?")[0];
  return isAllowedNextPath(path) ? raw : null;
}

export function authQuery(next: string | null, intent: TomIntent | null): string {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  if (intent) params.set("intent", intent);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function startFlowHref(intent: TomIntent): string {
  return `/start?intent=${intent}`;
}

/** 로그인 여부는 서버 `/start`가 CurrentContext로 판정한다. */
export function startOnboardingHref(
  intent: TomIntent,
  signedIn = false,
): string {
  void signedIn;
  return startFlowHref(intent);
}

export function loginHrefForWorkspace(
  workspace: "seller" | "buyer" | "expert" | "internal",
): string {
  if (workspace === "seller") return `/login${authQuery("/seller", "sell")}`;
  if (workspace === "buyer") return `/login${authQuery("/buyer", "buy")}`;
  if (workspace === "expert") return `/login${authQuery("/expert", null)}`;
  return `/login${authQuery("/internal", null)}`;
}

export function startConsultHref(intent: TomIntent): string {
  return consultPath(intent);
}
