import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentContext } from "@/lib/auth/session";
import { ACTIVE_PLATFORM_ROLE_COOKIE } from "@/lib/auth/active-role";
import { resolvePostAuthPath } from "@/lib/auth/workspace-router";
import { resolveContinuePath, resolveOnboardedContinuePath } from "@/lib/auth/continue-path";
import { consumePendingNextPath, setPendingNextPath } from "@/lib/auth/pending-next";
import { recordAudit } from "@/lib/audit";
import { authErrorMessage } from "@/lib/auth/errors";
import {
  parseIntentFromNext,
  parseTomIntent,
  safeNextPath,
} from "@/lib/tom/paths";
import { ErrorCode, PlatformRole } from "@/types/enums";

type ActionResult = {
  ok: boolean;
  message: string | null;
  redirectTo?: string;
};

function verificationLevel(role: PlatformRole): string {
  if (role === PlatformRole.SELLER_USER) return "S1";
  if (role === PlatformRole.BUYER_USER) return "B1";
  if (role === PlatformRole.EXPERT_USER) return "E0";
  return "S1";
}

export async function destinationAfterAuth(): Promise<string> {
  const context = await getCurrentContext();
  const onboarded = resolvePostAuthPath(context);
  if (onboarded.startsWith("/onboarding")) return onboarded;
  const pending = await consumePendingNextPath();
  return resolveOnboardedContinuePath(onboarded, pending);
}

export async function applyPlatformRole(role: PlatformRole): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED] };
  }
  if (
    role !== PlatformRole.SELLER_USER &&
    role !== PlatformRole.BUYER_USER &&
    role !== PlatformRole.EXPERT_USER
  ) {
    return { ok: false, message: authErrorMessage[ErrorCode.PERMISSION_DENIED] };
  }

  const { ensureAppProfile } = await import("@/lib/auth/actions");
  const ensured = await ensureAppProfile();
  if (!ensured.ok) return ensured;

  const context = await getCurrentContext();
  if (!context) {
    return { ok: false, message: authErrorMessage[ErrorCode.AUTH_REQUIRED] };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED] };
  }

  const { error } = await supabase.from("user_platform_roles").upsert(
    {
      user_id: context.user.id,
      platform_role: role,
      verification_level: verificationLevel(role),
    },
    { onConflict: "user_id,platform_role" },
  );

  if (error) {
    return { ok: false, message: "이용목적 저장에 실패했습니다." };
  }

  (await cookies()).set(ACTIVE_PLATFORM_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  await recordAudit({
    action: "SELECT_PLATFORM_ROLE",
    entityType: "user_platform_roles",
    entityId: context.user.id,
  });

  return { ok: true, message: null };
}

/** Server Component GET에서도 호출 가능한 로그인 후 이어가기. */
export async function computePostAuthRedirect(options?: {
  next?: string | null;
  intent?: string | null;
}): Promise<ActionResult> {
  const { ensureAppProfile } = await import("@/lib/auth/actions");
  const ensured = await ensureAppProfile();
  if (!ensured.ok) return ensured;

  const next = safeNextPath(options?.next ?? null);
  const intent =
    parseTomIntent(options?.intent) ?? parseIntentFromNext(next);

  if (intent === "sell") {
    const roleResult = await applyPlatformRole(PlatformRole.SELLER_USER);
    if (!roleResult.ok) return roleResult;
  }
  if (intent === "buy") {
    const roleResult = await applyPlatformRole(PlatformRole.BUYER_USER);
    if (!roleResult.ok) return roleResult;
  }

  const context = await getCurrentContext();
  const onboarded = resolvePostAuthPath(context);
  const continued = resolveContinuePath({
    next,
    intent,
    onboardedPath: onboarded,
  });
  await setPendingNextPath(continued.pendingNext);
  return {
    ok: true,
    message: null,
    redirectTo: continued.redirectTo,
  };
}
