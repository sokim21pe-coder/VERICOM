import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { EnvNotice } from "@/components/system/EnvNotice";
import { TomConsultPanel } from "@/components/tom/TomConsultPanel";
import { getCurrentContext } from "@/lib/auth/session";
import { resolvePostAuthPath } from "@/lib/auth/workspace-router";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getOrCreateTomConversation } from "@/lib/tom/actions";
import { authQuery, parseTomIntent, startConsultHref } from "@/lib/tom/paths";

export const dynamic = "force-dynamic";

export default async function ConsultPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
  const intent = parseTomIntent(params.intent) ?? "sell";
  const configured = isSupabaseConfigured();

  if (!configured) {
    return (
      <div className="min-h-screen bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-lg">
          <Link href="/" className="inline-flex bg-white">
            <BrandLogo className="h-12" />
          </Link>
          <h1 className="mt-10 text-2xl font-semibold">TOM 상담</h1>
          <p className="mt-3 text-sm text-muted">
            상담을 계정에 저장하려면 연결 정보가 필요합니다.
          </p>
          <div className="mt-6">
            <EnvNotice />
          </div>
          <p className="mt-8 text-sm">
            <Link href="/signup" className="text-navy underline">
              회원가입
            </Link>
            {" · "}
            <Link href="/login" className="text-navy underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const context = await getCurrentContext();
  if (!context) {
    redirect(`/login${authQuery(`/consult?intent=${intent}`, intent)}`);
  }
  const dest = resolvePostAuthPath(context);
  if (dest.startsWith("/onboarding")) {
    redirect(dest);
  }

  const started = await getOrCreateTomConversation(intent);
  if (!started.ok || !started.conversation) {
    return (
      <div className="min-h-screen bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-lg">
          <Link href="/" className="inline-flex bg-white">
            <BrandLogo className="h-12" />
          </Link>
          <h1 className="mt-10 text-2xl font-semibold">TOM 상담</h1>
          <p className="mt-4 text-sm text-muted">
            {started.message ?? "상담을 시작하지 못했습니다."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="bg-white" aria-label="베리컴 홈">
            <BrandLogo className="h-10" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={startConsultHref(intent === "sell" ? "buy" : "sell")}
              className="text-sm text-navy underline"
            >
              {intent === "sell" ? "인수 상담" : "매각 상담"}
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <TomConsultPanel
          intent={intent}
          conversationId={started.conversation.id}
          initialMessages={started.messages}
        />
      </main>
    </div>
  );
}
