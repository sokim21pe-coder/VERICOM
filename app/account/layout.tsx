import { WorkspaceChrome } from "@/components/layout/WorkspaceChrome";
import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { workspaceKindForRole } from "@/lib/auth/workspace-router";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = isSupabaseConfigured() ? await getCurrentContext() : null;
  const kind = workspaceKindForRole(context?.platformRole ?? null) ?? "seller";
  return <WorkspaceChrome workspace={kind}>{children}</WorkspaceChrome>;
}
