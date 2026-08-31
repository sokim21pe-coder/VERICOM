import { redirect } from "next/navigation";
import { computePostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { setPendingNextPath } from "@/lib/auth/pending-next";
import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  authQuery,
  consultPath,
  parseTomIntent,
} from "@/lib/tom/paths";

export const dynamic = "force-dynamic";

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const intent = parseTomIntent((await searchParams).intent);
  if (!intent) redirect("/");

  const next = consultPath(intent);
  const loginUrl = `/login${authQuery(next, intent)}`;

  await setPendingNextPath(next);

  if (!isSupabaseConfigured()) {
    redirect(loginUrl);
  }

  const context = await getCurrentContext();
  if (!context) {
    redirect(loginUrl);
  }

  const result = await computePostAuthRedirect({ next, intent });
  redirect(result.redirectTo ?? loginUrl);
}
