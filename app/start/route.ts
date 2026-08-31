import { NextResponse, type NextRequest } from "next/server";
import { computePostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  authQuery,
  consultPath,
  parseTomIntent,
} from "@/lib/tom/paths";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const intent = parseTomIntent(request.nextUrl.searchParams.get("intent"));
  if (!intent) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const next = consultPath(intent);
  const loginUrl = new URL(`/login${authQuery(next, intent)}`, request.url);

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(loginUrl);
  }

  const context = await getCurrentContext();
  if (!context) {
    return NextResponse.redirect(loginUrl);
  }

  const result = await computePostAuthRedirect({ next, intent });
  const dest = result.redirectTo ?? `/login${authQuery(next, intent)}`;
  return NextResponse.redirect(new URL(dest, request.url));
}
