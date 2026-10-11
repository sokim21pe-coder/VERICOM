import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AdminListResult<T> = {
  storageReady: boolean;
  total: number;
  limit: number;
  offset: number;
  rows: T[];
  message: string | null;
};

export type AdminDashboardKpis = {
  storageReady: boolean;
  totalUsers: number | null;
  activeUsers: number | null;
  totalCompanies: number | null;
  totalDeals: number | null;
  dealsBySellerStage: Record<string, number>;
  teasersByStatus: Record<string, number>;
  message: string | null;
};

export type AdminUserRow = {
  id: string;
  email: string;
  display_name: string;
  status: string;
  created_at: string;
  platform_roles: string[];
  company_name: string | null;
  membership_role: string | null;
};

export type AdminCompanyRow = {
  id: string;
  name: string;
  legal_name?: string | null;
  business_registration_number?: string | null;
  company_status: string;
  verification_status: string;
  created_at: string;
  last_activity_at?: string | null;
  member_count: number;
  deal_count: number;
  owner_name: string | null;
};

export type AdminDealRow = {
  id: string;
  title: string | null;
  seller_company_id: string | null;
  seller_company_name: string | null;
  seller_stage_key: string | null;
  status: string | null;
  created_at: string;
  participant_count?: number;
};

export type AdminAuditRow = {
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  actor_user_id: string | null;
  actor_email: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

const NOT_READY =
  "관리자 저장소가 아직 준비되지 않았습니다. 마이그레이션(0022) 적용 후 이용할 수 있습니다.";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function asRows<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function listFromPayload<T>(payload: unknown, fallbackLimit: number, fallbackOffset: number): AdminListResult<T> {
  const row = asRecord(payload);
  return {
    storageReady: true,
    total: Number(row.total ?? 0),
    limit: Number(row.limit ?? fallbackLimit),
    offset: Number(row.offset ?? fallbackOffset),
    rows: asRows<T>(row.rows),
    message: null,
  };
}

function emptyList<T>(message: string, limit: number, offset: number): AdminListResult<T> {
  return {
    storageReady: false,
    total: 0,
    limit,
    offset,
    rows: [],
    message,
  };
}

function isMissingRpc(error: { message?: string; code?: string } | null): boolean {
  const text = `${error?.message ?? ""} ${error?.code ?? ""}`;
  return /admin_|42883|does not exist|schema cache/i.test(text);
}

export async function loadAdminDashboardKpis(): Promise<AdminDashboardKpis> {
  const empty: AdminDashboardKpis = {
    storageReady: false,
    totalUsers: null,
    activeUsers: null,
    totalCompanies: null,
    totalDeals: null,
    dealsBySellerStage: {},
    teasersByStatus: {},
    message: NOT_READY,
  };
  if (!isSupabaseConfigured()) return empty;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return empty;

  const { data, error } = await supabase.rpc("admin_dashboard_kpis");
  if (error) {
    return { ...empty, message: isMissingRpc(error) ? NOT_READY : "관리자 지표를 읽지 못했습니다." };
  }
  const row = asRecord(data);
  return {
    storageReady: true,
    totalUsers: Number(row.total_users ?? 0),
    activeUsers: Number(row.active_users ?? 0),
    totalCompanies: Number(row.total_companies ?? 0),
    totalDeals: Number(row.total_deals ?? 0),
    dealsBySellerStage: (row.deals_by_seller_stage as Record<string, number>) ?? {},
    teasersByStatus: (row.teasers_by_status as Record<string, number>) ?? {},
    message: null,
  };
}

export type AdminRoleOption = { code: string; label_ko: string };

export async function loadAdminPlatformRoles(): Promise<AdminRoleOption[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("admin_get_platform_roles");
  if (error || !Array.isArray(data)) return [];
  return data as AdminRoleOption[];
}

export async function loadAdminUsers(input: {
  query?: string;
  status?: string;
  role?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminListResult<AdminUserRow>> {
  const limit = input.limit ?? 20;
  const offset = input.offset ?? 0;
  if (!isSupabaseConfigured()) return emptyList(NOT_READY, limit, offset);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return emptyList(NOT_READY, limit, offset);
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_query: input.query || null,
    p_status: input.status || null,
    p_role: input.role || null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) return emptyList(isMissingRpc(error) ? NOT_READY : "사용자 목록을 읽지 못했습니다.", limit, offset);
  return listFromPayload<AdminUserRow>(data, limit, offset);
}

export async function loadAdminUser(id: string): Promise<Record<string, unknown> | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("admin_get_user", { p_user_id: id });
  if (error || !data) return null;
  return asRecord(data);
}

export async function loadAdminCompanies(input: {
  query?: string;
  verification?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminListResult<AdminCompanyRow>> {
  const limit = input.limit ?? 20;
  const offset = input.offset ?? 0;
  if (!isSupabaseConfigured()) return emptyList(NOT_READY, limit, offset);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return emptyList(NOT_READY, limit, offset);
  const { data, error } = await supabase.rpc("admin_list_companies", {
    p_query: input.query || null,
    p_verification: input.verification || null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) return emptyList(isMissingRpc(error) ? NOT_READY : "회사 목록을 읽지 못했습니다.", limit, offset);
  return listFromPayload<AdminCompanyRow>(data, limit, offset);
}

export async function loadAdminCompany(id: string): Promise<Record<string, unknown> | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("admin_get_company", { p_company_id: id });
  if (error || !data) return null;
  return asRecord(data);
}

export async function loadAdminDeals(input: {
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminListResult<AdminDealRow>> {
  const limit = input.limit ?? 20;
  const offset = input.offset ?? 0;
  if (!isSupabaseConfigured()) return emptyList(NOT_READY, limit, offset);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return emptyList(NOT_READY, limit, offset);
  const { data, error } = await supabase.rpc("admin_list_deals", {
    p_query: input.query || null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) return emptyList(isMissingRpc(error) ? NOT_READY : "거래 목록을 읽지 못했습니다.", limit, offset);
  return listFromPayload<AdminDealRow>(data, limit, offset);
}

export async function loadAdminDeal(id: string): Promise<Record<string, unknown> | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("admin_get_deal", { p_deal_id: id });
  if (error || !data) return null;
  return asRecord(data);
}

export async function loadAdminAuditLogs(input: {
  query?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminListResult<AdminAuditRow>> {
  const limit = input.limit ?? 20;
  const offset = input.offset ?? 0;
  if (!isSupabaseConfigured()) return emptyList(NOT_READY, limit, offset);
  const supabase = await createSupabaseServerClient();
  if (!supabase) return emptyList(NOT_READY, limit, offset);
  const { data, error } = await supabase.rpc("admin_list_audit_logs", {
    p_query: input.query || null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) return emptyList(isMissingRpc(error) ? NOT_READY : "감사 로그를 읽지 못했습니다.", limit, offset);
  return listFromPayload<AdminAuditRow>(data, limit, offset);
}
