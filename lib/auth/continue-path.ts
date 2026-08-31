import {
  consultPath,
  type TomIntent,
} from "@/lib/tom/paths";

export function intendedNextPath(
  next: string | null,
  intent: TomIntent | null,
): string | null {
  if (next) return next;
  if (intent) return consultPath(intent);
  return null;
}

/**
 * 온보딩이 남았으면 그 화면을 우선하고, 끝나면 next/intent 목적지로 이어간다.
 * CurrentContext 온보딩 판정은 호출 측 Source of Truth를 따른다.
 */
export function resolveContinuePath(input: {
  next: string | null;
  intent: TomIntent | null;
  onboardedPath: string;
}): { redirectTo: string; pendingNext: string | null } {
  const intended = intendedNextPath(input.next, input.intent);
  if (input.onboardedPath.startsWith("/onboarding")) {
    return { redirectTo: input.onboardedPath, pendingNext: intended };
  }
  if (intended) {
    return { redirectTo: intended, pendingNext: null };
  }
  return { redirectTo: input.onboardedPath, pendingNext: null };
}

export function resolveOnboardedContinuePath(
  onboardedPath: string,
  pendingNext: string | null,
): string {
  if (onboardedPath.startsWith("/onboarding")) return onboardedPath;
  return pendingNext ?? onboardedPath;
}
