"use server";

import { revalidatePath } from "next/cache";
import { requireSuperAdmin } from "@/lib/admin/guard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AdminCompanyActionResult = {
  ok: boolean;
  message: string | null;
};

function fail(message: string): AdminCompanyActionResult {
  return { ok: false, message };
}

function companyRpcMessage(message: string | null | undefined): string {
  const text = message ?? "";
  if (text.includes("not permitted")) return "이 작업을 수행할 권한이 없습니다.";
  if (text.includes("ADMIN_REASON_REQUIRED")) return "사유를 입력해 주세요.";
  if (text.includes("ADMIN_COMPANY_NOT_FOUND")) return "회사를 찾을 수 없습니다.";
  if (text.includes("ADMIN_INVALID_COMPANY_VERIFICATION")) return "허용되지 않은 회사 확인 상태입니다.";
  if (text.includes("ADMIN_COMPANY_VERIFICATION_UNCHANGED")) return "현재와 같은 회사 확인 상태입니다.";
  if (text.includes("ADMIN_INVALID_COMPANY_STATUS")) return "허용되지 않은 회사 상태입니다.";
  if (text.includes("ADMIN_COMPANY_STATUS_UNCHANGED")) return "현재와 같은 회사 상태입니다.";
  return "요청을 처리하지 못했습니다.";
}

export async function updateAdminCompanyVerification(input: {
  companyId: string;
  verificationStatus: "unverified" | "pending" | "verified";
  reasonType: string;
  reasonDetail: string;
}): Promise<AdminCompanyActionResult> {
  if (!isSupabaseConfigured()) return fail("저장소가 준비되지 않았습니다.");
  const context = await requireSuperAdmin();
  if (!context) return fail("이 작업을 수행할 권한이 없습니다.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("저장소가 준비되지 않았습니다.");

  const { error } = await supabase.rpc("admin_update_company_verification", {
    p_company_id: input.companyId,
    p_verification_status: input.verificationStatus,
    p_reason_type: input.reasonType,
    p_reason_detail: input.reasonDetail,
  });
  if (error) return fail(companyRpcMessage(error.message));
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${input.companyId}`);
  revalidatePath("/admin/audit-logs");
  return { ok: true, message: null };
}

export async function updateAdminCompanyStatus(input: {
  companyId: string;
  companyStatus: "draft" | "active" | "inactive";
  reasonType: string;
  reasonDetail: string;
}): Promise<AdminCompanyActionResult> {
  if (!isSupabaseConfigured()) return fail("저장소가 준비되지 않았습니다.");
  const context = await requireSuperAdmin();
  if (!context) return fail("이 작업을 수행할 권한이 없습니다.");
  const supabase = await createSupabaseServerClient();
  if (!supabase) return fail("저장소가 준비되지 않았습니다.");

  const { error } = await supabase.rpc("admin_update_company_status", {
    p_company_id: input.companyId,
    p_company_status: input.companyStatus,
    p_reason_type: input.reasonType,
    p_reason_detail: input.reasonDetail,
  });
  if (error) return fail(companyRpcMessage(error.message));
  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${input.companyId}`);
  revalidatePath("/admin/audit-logs");
  return { ok: true, message: null };
}
