import { createSupabaseServerClient } from "@/lib/supabase/server";
import { platformRoleLabel } from "@/lib/workspace/visibility";
import { isTestToken } from "@/lib/workspace/user-display";
import type { CurrentContext } from "@/types/context";

export type MyProfileView = {
  /** 편집 폼 기본값. 테스트 시드 토큰은 빈 값으로 노출한다. */
  name: string;
  email: string;
  jobTitle: string;
  phone: string;
  companyId: string | null;
  companyName: string;
  roleLabel: string;
  /** DB에 job_title 컬럼이 아직 없으면(마이그레이션 미적용) true. */
  jobTitleUnavailable: boolean;
};

function formValue(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return isTestToken(trimmed) ? "" : trimmed;
}

export async function loadMyProfile(
  context: CurrentContext,
): Promise<MyProfileView> {
  const supabase = await createSupabaseServerClient();

  let phone = "";
  let jobTitle = "";
  let jobTitleUnavailable = false;

  if (supabase) {
    const withJobTitle = await supabase
      .from("persons")
      .select("phone, job_title")
      .eq("user_id", context.user.id)
      .maybeSingle();

    if (withJobTitle.error) {
      jobTitleUnavailable = true;
      const fallback = await supabase
        .from("persons")
        .select("phone")
        .eq("user_id", context.user.id)
        .maybeSingle();
      phone = fallback.data?.phone ?? "";
    } else {
      phone = withJobTitle.data?.phone ?? "";
      jobTitle = withJobTitle.data?.job_title ?? "";
    }
  }

  return {
    name: formValue(context.user.displayName),
    email: context.user.email ?? "",
    jobTitle: formValue(jobTitle),
    phone: phone.trim(),
    companyId: context.company?.id ?? null,
    companyName: formValue(context.company?.name),
    roleLabel: platformRoleLabel(context.platformRole),
    jobTitleUnavailable,
  };
}
