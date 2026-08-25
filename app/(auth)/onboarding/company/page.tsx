import { redirect } from "next/navigation";
import { CompanyOnboardingForm } from "@/components/auth/CompanyOnboardingForm";
import { EnvNotice } from "@/components/system/EnvNotice";
import { getCurrentContext } from "@/lib/auth/session";
import { needsCompany, resolvePostAuthPath } from "@/lib/auth/workspace-router";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function CompanyOnboardingPage() {
  if (!isSupabaseConfigured()) {
    return (
      <>
        <h1 className="text-2xl font-semibold text-foreground">
          소속 회사를 연결해 주세요.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          기존 회사를 찾거나, 회사명만으로 새 회사를 등록할 수 있습니다.
        </p>
        <div className="mt-6">
          <EnvNotice />
        </div>
        <CompanyOnboardingForm />
      </>
    );
  }

  const context = await getCurrentContext();
  if (!context) {
    redirect("/login");
  }
  if (context.platformRoles.length === 0) {
    redirect("/onboarding/purpose");
  }
  if (!context.platformRoles.some((role) => needsCompany(role))) {
    redirect(resolvePostAuthPath(context));
  }
  if (context.company) {
    redirect(resolvePostAuthPath(context));
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-foreground">
        소속 회사를 연결해 주세요.
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        기존 회사를 찾거나, 회사명만으로 새 회사를 등록할 수 있습니다.
      </p>
      <CompanyOnboardingForm />
    </>
  );
}
