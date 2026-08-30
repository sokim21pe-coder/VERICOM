import { redirect } from "next/navigation";
import { PurposeForm } from "@/components/auth/PurposeForm";
import { EnvNotice } from "@/components/system/EnvNotice";
import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function PurposePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          베리컴에서 무엇을 하시려고 하나요?
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          선택한 이용목적만 저장합니다. 이후 다른 역할도 추가할 수 있습니다.
        </p>
        <div className="mt-6">
          <EnvNotice />
        </div>
        <PurposeForm existingRoles={[]} />
      </div>
    );
  }

  const context = await getCurrentContext();
  if (!context) {
    redirect("/login");
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">
        베리컴에서 무엇을 하시려고 하나요?
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        선택한 이용목적만 저장합니다. 이후 다른 역할도 추가할 수 있습니다.
      </p>
      <PurposeForm existingRoles={context.platformRoles} />
    </div>
  );
}
