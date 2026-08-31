import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getCurrentContext } from "@/lib/auth/session";
import {
  resolvePostAuthPath,
  userCanAccessWorkspace,
  type WorkspaceKind,
} from "@/lib/auth/workspace-router";
import { loginHrefForWorkspace } from "@/lib/tom/paths";
import {
  peekPendingNextPath,
  setPendingNextPath,
} from "@/lib/auth/pending-next";
import type { CurrentContext } from "@/types/context";

const workspaceHome: Record<WorkspaceKind, string> = {
  seller: "/seller",
  buyer: "/buyer",
  expert: "/expert",
  internal: "/internal",
};

export async function requireWorkspace(
  workspace: WorkspaceKind,
): Promise<CurrentContext | null> {
  if (!isSupabaseConfigured()) return null;

  const context = await getCurrentContext();
  if (!context) {
    redirect(loginHrefForWorkspace(workspace));
  }

  const dest = resolvePostAuthPath(context);
  if (dest.startsWith("/onboarding")) {
    if (!(await peekPendingNextPath())) {
      await setPendingNextPath(workspaceHome[workspace]);
    }
    redirect(dest);
  }

  if (!userCanAccessWorkspace(workspace, context.platformRoles)) {
    redirect(dest);
  }

  return context;
}
