import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentContext } from "@/lib/auth/session";
import {
  resolvePostAuthPath,
  userCanAccessWorkspace,
  type WorkspaceKind,
} from "@/lib/auth/workspace-router";
import type { CurrentContext } from "@/types/context";

export async function requireWorkspace(
  workspace: WorkspaceKind,
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

  if (!userCanAccessWorkspace(workspace, context.platformRoles)) {
    redirect(dest);
  }

  return context;
}
