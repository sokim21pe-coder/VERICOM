import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AdminCompanyRowV12 = {
  id: string;
  name: string;
  legal_name: string | null;
  business_registration_number: string | null;
  company_status: string;
  verification_status: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  deal_count: number;
  owner_name: string | null;
  last_activity_at: string | null;
};

export type AdminCompanyListV12 = {
  total: number;
  limit: number;
  offset: number;
  rows: AdminCompanyRowV12[];
  message: string | null;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export async function loadAdminCompaniesV12(input: {
  query?: string;
  verification?: string;
  limit?: number;
  offset?: number;
}): Promise<AdminCompanyListV12> {
  const limit = input.limit ?? 20;
  const offset = input.offset ?? 0;
  const empty: AdminCompanyListV12 = { total: 0, limit, offset, rows: [], message: "관리자 회사 정보를 읽지 못했습니다." };
  if (!isSupabaseConfigured()) return empty;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return empty;

  const { data, error } = await supabase.rpc("admin_list_companies", {
    p_query: input.query || null,
    p_verification: input.verification || null,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) return { ...empty, message: "회사 관리 저장소가 아직 준비되지 않았습니다. 0024 적용 후 이용할 수 있습니다." };
  const payload = asRecord(data);
  return {
    total: Number(payload.total ?? 0),
    limit: Number(payload.limit ?? limit),
    offset: Number(payload.offset ?? offset),
    rows: Array.isArray(payload.rows) ? (payload.rows as AdminCompanyRowV12[]) : [],
    message: null,
  };
}

export async function loadAdminCompanyV12(id: string): Promise<Record<string, unknown> | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("admin_get_company", { p_company_id: id });
  if (error || !data) return null;
  return asRecord(data);
}
