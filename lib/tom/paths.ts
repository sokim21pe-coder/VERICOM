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

/** 열린 리다이렉트 방지. 내부 경로만 허용. */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
  if (raw.includes("://")) return null;
  const path = raw.split("?")[0];
  const allowed =
    path === "/consult" ||
    path === "/seller" ||
    path === "/buyer" ||
    path === "/expert" ||
    path.startsWith("/onboarding/");
  return allowed ? raw : null;
}

export function authQuery(next: string | null, intent: TomIntent | null): string {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  if (intent) params.set("intent", intent);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function startOnboardingHref(
  intent: TomIntent,
  signedIn: boolean,
): string {
  if (signedIn) {
    return intent === "sell" ? "/seller" : "/buyer";
  }
  return `/signup${authQuery(null, intent)}`;
}

export function startConsultHref(intent: TomIntent): string {
  return consultPath(intent);
}
