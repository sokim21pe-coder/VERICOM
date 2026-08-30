"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentContext } from "@/lib/auth/session";
import { GUEST_COOKIE } from "@/lib/auth/guest-session";
import { ACTIVE_PLATFORM_ROLE_COOKIE } from "@/lib/auth/active-role";
import {
  ACTIVE_DEAL_COOKIE,
  asDealId,
  isCompanyAllowedOnDeal,
} from "@/lib/auth/active-deal";
import { resolvePostAuthPath, workspacePathForRole } from "@/lib/auth/workspace-router";
import { recordAudit } from "@/lib/audit";
import { authErrorMessage } from "@/lib/auth/errors";
import {
  parseIntentFromNext,
  parseTomIntent,
  safeNextPath,
} from "@/lib/tom/paths";
import {
  DealRole,
  ErrorCode,
  MembershipRole,
  MembershipStatus,
  PlatformRole,
} from "@/types/enums";

export type ActionResult = {
  ok: boolean;
  message: string | null;
  redirectTo?: string;
};

function envError(): ActionResult {
  return {
    ok: false,
    message: authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED],
  };
}

function verificationLevel(role: PlatformRole): string {
  if (role === PlatformRole.SELLER_USER) return "S1";
  if (role === PlatformRole.BUYER_USER) return "B1";
  if (role === PlatformRole.EXPERT_USER) return "E0";
  return "S1";
}

export async function ensureAppProfile(): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return envError();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return envError();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { ok: false, message: authErrorMessage[ErrorCode.AUTH_REQUIRED] };
  }

  const displayName =
    (typeof user.user_metadata?.display_name === "string" &&
      user.user_metadata.display_name.trim()) ||
    user.email.split("@")[0];

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!existing) {
    const { data: created, error } = await supabase
      .from("users")
      .insert({
        auth_user_id: user.id,
        email: user.email,
        display_name: displayName,
        status: "active",
      })
      .select("id")
      .single();
    if (error || !created) {
      return { ok: false, message: "사용자 정보를 만들지 못했습니다." };
    }
    await supabase.from("persons").upsert(
      {
        user_id: created.id,
        full_name: displayName,
        email: user.email,
      },
      { onConflict: "user_id" },
    );
  }

  const guestId = (await cookies()).get(GUEST_COOKIE)?.value;
  if (guestId) {
    await supabase
      .from("users")
      .update({ guest_session_id: guestId })
      .eq("auth_user_id", user.id);
  }

  return { ok: true, message: null };
}

export async function getPostAuthRedirect(options?: {
  next?: string | null;
  intent?: string | null;
}): Promise<ActionResult> {
  const ensured = await ensureAppProfile();
  if (!ensured.ok) return ensured;

  const next = safeNextPath(options?.next ?? null);
  const intent =
    parseTomIntent(options?.intent) ?? parseIntentFromNext(next);

  if (intent === "sell") {
    const roleResult = await selectPlatformRole(PlatformRole.SELLER_USER);
    if (!roleResult.ok) return roleResult;
  }
  if (intent === "buy") {
    const roleResult = await selectPlatformRole(PlatformRole.BUYER_USER);
    if (!roleResult.ok) return roleResult;
  }

  const context = await getCurrentContext();
  const onboarded = resolvePostAuthPath(context);
  if (next?.startsWith("/consult") && !onboarded.startsWith("/onboarding")) {
    return { ok: true, message: null, redirectTo: next };
  }
  return {
    ok: true,
    message: null,
    redirectTo: onboarded,
  };
}

export async function selectPlatformRole(
  role: PlatformRole,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return envError();
  if (
    role !== PlatformRole.SELLER_USER &&
    role !== PlatformRole.BUYER_USER &&
    role !== PlatformRole.EXPERT_USER
  ) {
    return { ok: false, message: authErrorMessage[ErrorCode.PERMISSION_DENIED] };
  }

  const ensured = await ensureAppProfile();
  if (!ensured.ok) return ensured;

  const context = await getCurrentContext();
  if (!context) {
    return { ok: false, message: authErrorMessage[ErrorCode.AUTH_REQUIRED] };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return envError();

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

  const next = await getCurrentContext();
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: null,
    redirectTo: resolvePostAuthPath(next),
  };
}

export async function searchCompanies(
  query: string,
): Promise<{ id: string; name: string }[]> {
  if (!isSupabaseConfigured() || query.trim().length < 1) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("search_companies_by_name", {
    q: query.trim(),
  });
  if (error || !data) return [];
  return data as { id: string; name: string }[];
}

export async function registerNewCompany(form: {
  name: string;
  legalName: string;
  industry: string;
  website: string;
  businessRegistrationNumber: string;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return envError();
  const name = form.name.trim();
  if (!name) {
    return { ok: false, message: "회사명을 입력해 주세요." };
  }

  const ensured = await ensureAppProfile();
  if (!ensured.ok) return ensured;
  const context = await getCurrentContext();
  if (!context) {
    return { ok: false, message: authErrorMessage[ErrorCode.AUTH_REQUIRED] };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return envError();

  const { data: companyId, error: companyError } = await supabase.rpc(
    "register_company_for_current_user",
    {
      p_name: name,
      p_legal_name: form.legalName.trim() || null,
      p_industry: form.industry.trim() || null,
      p_website: form.website.trim() || null,
      p_business_registration_number:
        form.businessRegistrationNumber.trim() || null,
    },
  );

  if (companyError || !companyId) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.COMPANY_CREATE_FAILED],
    };
  }

  await recordAudit({
    action: "CREATE_COMPANY_MEMBERSHIP",
    entityType: "companies",
    entityId: companyId as string,
  });

  const next = await getCurrentContext();
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: null,
    redirectTo: resolvePostAuthPath(next),
  };
}

export async function requestCompanyLink(
  companyId: string,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return envError();
  const ensured = await ensureAppProfile();
  if (!ensured.ok) return ensured;
  const context = await getCurrentContext();
  if (!context) {
    return { ok: false, message: authErrorMessage[ErrorCode.AUTH_REQUIRED] };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return envError();

  const { error } = await supabase.from("company_memberships").insert({
    user_id: context.user.id,
    company_id: companyId,
    membership_role: MembershipRole.EMPLOYEE,
    status: MembershipStatus.PENDING,
    verification_status: "unverified",
  });

  if (error) {
    return {
      ok: false,
      message: authErrorMessage[ErrorCode.MEMBERSHIP_CREATE_FAILED],
    };
  }

  await recordAudit({
    action: "REQUEST_COMPANY_MEMBERSHIP",
    entityType: "companies",
    entityId: companyId,
  });

  const next = await getCurrentContext();
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "연결 요청을 저장했습니다. 회사 확인은 후속 Verification입니다.",
    redirectTo: resolvePostAuthPath(next),
  };
}

export async function setActivePlatformRole(
  role: PlatformRole,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return envError();
  const context = await getCurrentContext();
  if (!context) {
    return { ok: false, message: authErrorMessage[ErrorCode.AUTH_REQUIRED] };
  }
  if (!context.platformRoles.includes(role)) {
    return { ok: false, message: authErrorMessage[ErrorCode.PERMISSION_DENIED] };
  }
  (await cookies()).set(ACTIVE_PLATFORM_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  await recordAudit({
    action: "WORKSPACE_SWITCHED",
    entityType: "user_platform_roles",
    entityId: context.user.id,
  });
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: null,
    redirectTo: workspacePathForRole(role),
  };
}

export async function setActiveDeal(dealId: string | null): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return envError();
  const context = await getCurrentContext();
  if (!context) {
    return { ok: false, message: authErrorMessage[ErrorCode.AUTH_REQUIRED] };
  }

  const jar = await cookies();
  if (!dealId) {
    jar.set(ACTIVE_DEAL_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    await recordAudit({
      action: "ACTIVE_DEAL_CLEARED",
      entityType: "deals",
      entityId: context.user.id,
    });
    revalidatePath("/", "layout");
    return { ok: true, message: null };
  }

  const id = asDealId(dealId);
  if (!id) {
    return { ok: false, message: authErrorMessage[ErrorCode.PERMISSION_DENIED] };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return envError();

  const { data: participant } = await supabase
    .from("deal_participants")
    .select("deal_id, deal_role")
    .eq("user_id", context.user.id)
    .eq("deal_id", id)
    .maybeSingle();

  const role = (Object.values(DealRole) as string[]).includes(
    participant?.deal_role ?? "",
  )
    ? (participant?.deal_role as DealRole)
    : null;

  if (!participant?.deal_id || !role) {
    return { ok: false, message: authErrorMessage[ErrorCode.PERMISSION_DENIED] };
  }

  const { data: dealRow } = await supabase
    .from("deals")
    .select("id, seller_company_id")
    .eq("id", participant.deal_id)
    .maybeSingle();

  if (
    !dealRow ||
    !isCompanyAllowedOnDeal({
      companyId: context.company?.id ?? null,
      sellerCompanyId: dealRow.seller_company_id,
      dealRole: role,
    })
  ) {
    return { ok: false, message: authErrorMessage[ErrorCode.PERMISSION_DENIED] };
  }

  jar.set(ACTIVE_DEAL_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  });
  await recordAudit({
    action: "ACTIVE_DEAL_SELECTED",
    entityType: "deals",
    entityId: id,
  });
  revalidatePath("/", "layout");
  return { ok: true, message: null };
}

export async function signOutAction(): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return envError();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return envError();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  return { ok: true, message: null, redirectTo: "/" };
}
