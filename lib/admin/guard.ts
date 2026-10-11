import { redirect } from "next/navigation";
import { isPlatformSuperAdmin } from "@/lib/admin/access";
import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { CurrentContext } from "@/types/context";

/**
 * /admin 전용 서버 가드.
 * CurrentContext 타입은 변경하지 않는다. Company/Deal Active 선택은 요구하지 않는다.
 */
export async function requireSuperAdmin(): Promise<CurrentContext | null> {
  if (!isSupabaseConfigured()) return null;

  const context = await getCurrentContext();
  if (!context) {
    redirect("/login?next=/admin/dashboard");
  }
  if (!isPlatformSuperAdmin(context.platformRoles)) {
    redirect("/unauthorized");
  }
  return context;
}
