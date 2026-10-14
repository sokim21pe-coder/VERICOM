"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireSuperAdmin } from "@/lib/admin/guard";
import { mapAdminRpcError } from "@/lib/admin/operations";

export type AdminActionResult = {
  ok: boolean;
  message: string | null;
};

function fail(message: string): AdminActionResult {
  return { ok: false, message };
}

function rpcMessage(error: { message?: string } | null): string {
  return mapAdminRpcError(error?.message);
}

export async function updateAdminUserStatus(input: {
  userId: string;
  status: "active" | "disabled";
  reasonType: string;
  reasonDetail: string;
}): Promise<AdminActionResult> {
  if (!isSupabaseConfigured()) return fail("저장소가 준비되지 않았습니다.");
  const context = await requireSuperAdmin();
  if (!context) return fail("이 작업을 수행할 권한이 없습니다.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("저장소가 준비되지 않았습니다.");

  const { error } = await supabase.rpc("admin_update_user_status", {
    p_user_id: input.userId,
    p_status: input.status,
    p_reason_type: input.reasonType,
    p_reason_detail: input.reasonDetail,
  });
  if (error) return fail(rpcMessage(error));
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${input.userId}`);
  revalidatePath("/admin/audit-logs");
  return { ok: true, message: null };
}

export async function addAdminPlatformRole(input: {
  userId: string;
  role: string;
  reasonType: string;
  reasonDetail: string;
  confirm?: string;
}): Promise<AdminActionResult> {
  if (!isSupabaseConfigured()) return fail("저장소가 준비되지 않았습니다.");
  const context = await requireSuperAdmin();
  if (!context) return fail("이 작업을 수행할 권한이 없습니다.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("저장소가 준비되지 않았습니다.");

  const { error } = await supabase.rpc("admin_add_platform_role", {
    p_user_id: input.userId,
    p_role: input.role,
    p_reason_type: input.reasonType,
    p_reason_detail: input.reasonDetail,
    p_confirm: input.confirm ?? null,
  });
  if (error) return fail(rpcMessage(error));
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${input.userId}`);
  revalidatePath("/admin/audit-logs");
  return { ok: true, message: null };
}

export async function removeAdminPlatformRole(input: {
  userId: string;
  role: string;
  reasonType: string;
  reasonDetail: string;
}): Promise<AdminActionResult> {
  if (!isSupabaseConfigured()) return fail("저장소가 준비되지 않았습니다.");
  const context = await requireSuperAdmin();
  if (!context) return fail("이 작업을 수행할 권한이 없습니다.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("저장소가 준비되지 않았습니다.");

  const { error } = await supabase.rpc("admin_remove_platform_role", {
    p_user_id: input.userId,
    p_role: input.role,
    p_reason_type: input.reasonType,
    p_reason_detail: input.reasonDetail,
  });
  if (error) return fail(rpcMessage(error));
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${input.userId}`);
  revalidatePath("/admin/audit-logs");
  return { ok: true, message: null };
}

export async function updateAdminCompanyVerification(input: {
  companyId: string;
  verification: string;
  reasonType: string;
  reasonDetail: string;
}): Promise<AdminActionResult> {
  if (!isSupabaseConfigured()) return fail("저장소가 준비되지 않았습니다.");
  const context = await requireSuperAdmin();
  if (!context) return fail("이 작업을 수행할 권한이 없습니다.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("저장소가 준비되지 않았습니다.");

  const { error } = await supabase.rpc("admin_update_company_verification", {
    p_company_id: input.companyId,
    p_verification: input.verification,
    p_reason_type: input.reasonType,
    p_reason_detail: input.reasonDetail,
  });
  if (error) return fail(rpcMessage(error));
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${input.companyId}`);
  revalidatePath("/admin/audit-logs");
  return { ok: true, message: null };
}

export async function updateAdminCompanyStatus(input: {
  companyId: string;
  status: string;
  reasonType: string;
  reasonDetail: string;
}): Promise<AdminActionResult> {
  if (!isSupabaseConfigured()) return fail("저장소가 준비되지 않았습니다.");
  const context = await requireSuperAdmin();
  if (!context) return fail("이 작업을 수행할 권한이 없습니다.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("저장소가 준비되지 않았습니다.");

  const { error } = await supabase.rpc("admin_update_company_status", {
    p_company_id: input.companyId,
    p_status: input.status,
    p_reason_type: input.reasonType,
    p_reason_detail: input.reasonDetail,
  });
  if (error) return fail(rpcMessage(error));
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${input.companyId}`);
  revalidatePath("/admin/audit-logs");
  return { ok: true, message: null };
}

