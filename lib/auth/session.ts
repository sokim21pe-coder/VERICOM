import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  ACTIVE_PLATFORM_ROLE_COOKIE,
  resolveActivePlatformRole,
} from "@/lib/auth/active-role";
import type { CurrentContext } from "@/types/context";
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
      .select("id, name, verification_status")
      .eq("id", membership.company_id)
      .maybeSingle();
    if (companyRow) {
      company = {
        id: companyRow.id,
        name: companyRow.name,
        verificationStatus: companyRow.verification_status,
      };
    }
  }

  const { data: participant } = await supabase
    .from("deal_participants")
    .select("deal_id, deal_role")
    .eq("user_id", appUser.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let deal = null;
  let dealRole: DealRole | null = null;
  let permissions: string[] = [];

  if (participant?.deal_id) {
    const { data: dealRow } = await supabase
      .from("deals")
      .select("id, title")
      .eq("id", participant.deal_id)
      .maybeSingle();
    if (dealRow) {
      deal = { id: dealRow.id, title: dealRow.title };
      dealRole = asDealRole(participant.deal_role);
      const { data: permRows } = await supabase
        .from("deal_permissions")
        .select("permission_code")
        .eq("user_id", appUser.id)
        .eq("deal_id", dealRow.id);
      permissions = (permRows ?? []).map((row) => row.permission_code);
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
