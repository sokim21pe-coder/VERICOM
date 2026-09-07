"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentContext } from "@/lib/auth/session";
import { recordAudit } from "@/lib/audit";
import type { ProfileActionState } from "@/lib/account/profile-types";

function fail(message: string): ProfileActionState {
  return { ok: false, message };
}

/**
 * 내 프로필 저장.
 * - 이름: users.display_name + persons.full_name 동기화 (자기 행, 기존 self RLS)
 * - 직책/연락처: persons.job_title / persons.phone (자기 행, 기존 self RLS)
 * - 회사명: update_company_for_current_user RPC (active member만, 0019)
 * 이메일/회원유형은 읽기 전용이라 저장하지 않는다.
 */
export async function updateMyProfile(
  _prev: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  if (!isSupabaseConfigured()) {
    return fail("Supabase 연결 정보가 없어 저장할 수 없습니다.");
  }

  const context = await getCurrentContext();
  if (!context) {
    return fail("로그인이 필요합니다.");
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return fail("Supabase 연결 정보가 없어 저장할 수 없습니다.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const jobTitle = String(formData.get("jobTitle") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();

  if (!name) {
    return fail("이름을 입력해 주세요.");
  }

  const { error: userError } = await supabase
    .from("users")
    .update({ display_name: name })
    .eq("id", context.user.id);
  if (userError) {
    return fail("이름을 저장하지 못했습니다.");
  }

  // persons: job_title 컬럼이 없을 수 있어(0019 미적용) 실패 시 job_title 제외로 재시도.
  const personBase = {
    user_id: context.user.id,
    full_name: name,
    email: context.user.email,
    phone: phone || null,
  };
  const personUpsert = await supabase
    .from("persons")
    .upsert({ ...personBase, job_title: jobTitle || null }, { onConflict: "user_id" });
  let jobTitleSaved = !personUpsert.error;
  if (personUpsert.error) {
    const retry = await supabase
      .from("persons")
      .upsert(personBase, { onConflict: "user_id" });
    if (retry.error) {
      return fail("연락처·직책을 저장하지 못했습니다.");
    }
    jobTitleSaved = false;
  }

  let companySaved = true;
  if (context.company?.id && companyName && companyName !== context.company.name) {
    const { error: companyError } = await supabase.rpc(
      "update_company_for_current_user",
      {
        p_company_id: context.company.id,
        p_name: companyName,
      },
    );
    if (companyError) {
      companySaved = false;
    }
  }

  await recordAudit({
    action: "UPDATE_PROFILE",
    entityType: "users",
    entityId: context.user.id,
  });

  revalidatePath("/", "layout");
  revalidatePath("/account/profile");

  if (!companySaved) {
    return {
      ok: true,
      message:
        "이름·연락처를 저장했습니다. 회사명은 저장하지 못했습니다(권한 또는 마이그레이션 확인 필요).",
    };
  }
  if (!jobTitleSaved && jobTitle) {
    return {
      ok: true,
      message:
        "이름·연락처를 저장했습니다. 직책 컬럼이 아직 준비되지 않아 직책은 저장되지 않았습니다.",
    };
  }
  return { ok: true, message: "변경사항을 저장했습니다." };
}
