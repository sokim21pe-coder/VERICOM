import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { EnvNotice } from "@/components/system/EnvNotice";
import { computePostAuthRedirect } from "@/lib/auth/post-auth-redirect";
import { getCurrentContext } from "@/lib/auth/session";
import { resolvePostAuthPath } from "@/lib/auth/workspace-router";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  authQuery,
  parseIntentFromNext,
  parseTomIntent,
  safeNextPath,
} from "@/lib/tom/paths";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; intent?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(params.next ?? null);
  const intent =
    parseTomIntent(params.intent) ?? parseIntentFromNext(next);
  const query = authQuery(next, intent);

  if (isSupabaseConfigured()) {
    const context = await getCurrentContext();
    if (context) {
      const result = await computePostAuthRedirect({ next, intent });
      redirect(result.redirectTo ?? next ?? resolvePostAuthPath(context));
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-foreground">로그인</h1>
      <p className="mt-3 text-sm text-muted">
        {intent
          ? "로그인하면 TOM 상담을 이어서 시작합니다."
          : "이메일과 비밀번호로 로그인합니다."}
      </p>
      {!isSupabaseConfigured() ? (
        <div className="mt-6">
          <EnvNotice />
        </div>
      ) : null}
      <LoginForm next={next} intent={intent} />
      <p className="mt-6 text-sm text-muted">
        <Link href={`/signup${query}`} className="text-navy underline">
          회원가입
        </Link>
        {" · "}
        <Link href="/" className="text-navy underline">
          홈으로
        </Link>
      </p>
    </>
  );
}
