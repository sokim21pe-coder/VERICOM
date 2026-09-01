import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  ACTIVE_PLATFORM_ROLE_COOKIE,
  resolveActivePlatformRole,
} from "@/lib/auth/active-role";
import {
  ACTIVE_DEAL_COOKIE,
  asDealId,
  isCompanyAllowedOnDeal,
} from "@/lib/auth/active-deal";
import type { AccessibleDeal, CurrentContext } from "@/types/context";
import {
  DealRole,
  MembershipRole,
  MembershipStatus,
  PlatformRole,
} from "@/types/enums";

function asPlatformRole(value: string): PlatformRole | null {
  return (Object.values(PlatformRole) as string[]).includes(value)
    ? (value as PlatformRole)
    : null;
}

function asDealRole(value: string): DealRole | null {
  return (Object.values(DealRole) as string[]).includes(value)
    ? (value as DealRole)
    : null;
}

/** 서버에서만 호출. URL 쿼리로 Role/Permission을 받지 않는다. */
export async function getCurrentContext(): Promise<CurrentContext | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const { data: appUser } = await supabase
    .from("users")
    .select("id, auth_user_id, email, display_name")
    .eq("auth_user_id", authUser.id)
    .maybeSingle();

  if (!appUser) return null;

  const { data: roleRows } = await supabase
    .from("user_platform_roles")
    .select("platform_role")
    .eq("user_id", appUser.id)
    .order("updated_at", { ascending: false });

  const platformRoles = (roleRows ?? [])
    .map((row) => asPlatformRole(row.platform_role))
    .filter((role): role is PlatformRole => role !== null);

  const cookieRole = asPlatformRole(
    (await cookies()).get(ACTIVE_PLATFORM_ROLE_COOKIE)?.value ?? "",
  );
  const currentRole = resolveActivePlatformRole(cookieRole, platformRoles);

  const { data: membership } = await supabase
    .from("company_memberships")
    .select("id, company_id, membership_role, status")
    .eq("user_id", appUser.id)
    .in("status", ["active", "pending"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let company = null;
  if (membership?.company_id) {
    const { data: companyRow } = await supabase
      .from("companies")
      .select("id, name, industry, verification_status")
      .eq("id", membership.company_id)
      .maybeSingle();
    if (companyRow) {
      company = {
        id: companyRow.id,
        name: companyRow.name,
        industry: companyRow.industry ?? null,
        verificationStatus: companyRow.verification_status,
      };
    }
  }

  let deal = null;
  let dealRole: DealRole | null = null;
  let permissions: string[] = [];

  const requestedDealId = asDealId(
    (await cookies()).get(ACTIVE_DEAL_COOKIE)?.value ?? "",
  );

  if (requestedDealId) {
    const { data: participant } = await supabase
      .from("deal_participants")
      .select("deal_id, deal_role")
      .eq("user_id", appUser.id)
      .eq("deal_id", requestedDealId)
      .maybeSingle();

    const role = asDealRole(participant?.deal_role ?? "");
    if (participant?.deal_id && role) {
      const { data: dealRow } = await supabase
        .from("deals")
        .select("id, title, seller_company_id")
        .eq("id", participant.deal_id)
        .maybeSingle();
      if (
        dealRow &&
        isCompanyAllowedOnDeal({
          companyId: company?.id ?? null,
          sellerCompanyId: dealRow.seller_company_id,
          dealRole: role,
        })
      ) {
        deal = { id: dealRow.id, title: dealRow.title };
        dealRole = role;
        const { data: permRows } = await supabase
          .from("deal_permissions")
          .select("permission_code")
          .eq("user_id", appUser.id)
          .eq("deal_id", dealRow.id);
        permissions = (permRows ?? []).map((row) => row.permission_code);
      }
    }
  }

  return {
    user: {
      id: appUser.id,
      authUserId: appUser.auth_user_id,
      email: appUser.email,
      displayName: appUser.display_name,
    },
    company,
    platformRole: currentRole,
    platformRoles,
    companyMembership: membership
      ? {
          id: membership.id,
          companyId: membership.company_id,
          role: membership.membership_role as MembershipRole,
          status: membership.status as MembershipStatus,
        }
      : null,
    deal,
    dealRole,
    permissions,
  };
}

/** 현재 User가 참여하고 회사 역할이 맞는 Deal만. 자동 선택은 하지 않는다. */
export async function listAccessibleDeals(): Promise<AccessibleDeal[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const context = await getCurrentContext();
  if (!context) return [];

  const { data: parts } = await supabase
    .from("deal_participants")
    .select("deal_id, deal_role")
    .eq("user_id", context.user.id)
    .order("created_at", { ascending: true });

  const out: AccessibleDeal[] = [];
  for (const row of parts ?? []) {
    const role = asDealRole(row.deal_role);
    if (!role || !row.deal_id) continue;
    const { data: dealRow } = await supabase
      .from("deals")
      .select("id, title, seller_company_id")
      .eq("id", row.deal_id)
      .maybeSingle();
    if (!dealRow) continue;
    if (
      !isCompanyAllowedOnDeal({
        companyId: context.company?.id ?? null,
        sellerCompanyId: dealRow.seller_company_id,
        dealRole: role,
      })
    ) {
      continue;
    }
    out.push({
      id: dealRow.id,
      title: dealRow.title,
      dealRole: role,
      sellerCompanyId: dealRow.seller_company_id,
    });
  }
  return out;
}

