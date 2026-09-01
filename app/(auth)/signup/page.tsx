import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";
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

export default async function SignupPage({
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
      <h1 className="text-2xl font-semibold text-foreground">회원가입</h1>
      <p className="mt-3 text-sm text-muted">
        {intent
          ? "이름, 이메일, 비밀번호만 입력하면 TOM(AI) 상담을 시작합니다."
          : "이름, 이메일, 비밀번호만 입력하면 됩니다."}
      </p>
      {!isSupabaseConfigured() ? (
        <div className="mt-6">
          <EnvNotice />
        </div>
      ) : null}
      <SignupForm next={next} intent={intent} />
      <p className="mt-6 text-sm text-muted">
        이미 계정이 있으면{" "}
        <Link href={`/login${query}`} className="text-navy underline">
          로그인
        </Link>
      </p>
    </>
  );
}
