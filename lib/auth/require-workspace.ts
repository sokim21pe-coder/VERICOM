import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentContext } from "@/lib/auth/session";
import { resolvePostAuthPath } from "@/lib/auth/workspace-router";
import { PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";

export async function requireWorkspace(
  workspace: "seller" | "buyer" | "expert",
): Promise<CurrentContext | null> {
  if (!isSupabaseConfigured()) return null;

  const context = await getCurrentContext();
  if (!context) {
    redirect("/login");
  }

  const dest = resolvePostAuthPath(context);
  if (dest.startsWith("/onboarding")) {
    redirect(dest);
  }

  const hasRole =
    workspace === "seller"
      ? context.platformRoles.includes(PlatformRole.SELLER_USER)
      : workspace === "buyer"
        ? context.platformRoles.includes(PlatformRole.BUYER_USER)
        : context.platformRoles.includes(PlatformRole.EXPERT_USER);

  if (!hasRole) {
    redirect(dest);
  }

  return context;
}
