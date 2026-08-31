import { redirect } from "next/navigation";
import { WorkspaceChrome } from "@/components/layout/WorkspaceChrome";
import { TomConsultPanel } from "@/components/tom/TomConsultPanel";
import { getCurrentContext } from "@/lib/auth/session";
import { resolvePostAuthPath } from "@/lib/auth/workspace-router";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  getOrCreateTomConversation,
  getSellerLevel0Valuation,
} from "@/lib/tom/actions";
import { consultWorkspace, resolveConsultIntent } from "@/lib/tom/intent";
import { authQuery } from "@/lib/tom/paths";
import { EnvNotice } from "@/components/system/EnvNotice";
import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";

export const dynamic = "force-dynamic";

export default async function ConsultPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const params = await searchParams;
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
        </div>
      </div>
    );
  }

  const context = await getCurrentContext();
  if (!context) {
    const fallback = params.intent === "buy" ? "buy" : "sell";
    redirect(`/login${authQuery(`/consult?intent=${fallback}`, fallback)}`);
  }

  const dest = resolvePostAuthPath(context);
  if (dest.startsWith("/onboarding")) {
    redirect(dest);
  }

  const intent = resolveConsultIntent(context, params.intent);
  if (!intent) {
    redirect(dest);
  }

  const started = await getOrCreateTomConversation(intent);
  if (!started.ok || !started.conversation) {
    return (
      <WorkspaceChrome workspace={consultWorkspace(intent)}>
        <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
          <h1 className="text-2xl font-semibold">TOM 상담</h1>
          <p className="mt-4 text-sm text-muted">
            {started.message ?? "상담을 시작하지 못했습니다."}
          </p>
        </main>
      </WorkspaceChrome>
    );
  }

  const initialValuation =
    intent === "sell"
      ? await getSellerLevel0Valuation(started.conversation.id)
      : null;

  return (
    <WorkspaceChrome workspace={consultWorkspace(intent)}>
      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <TomConsultPanel
          intent={intent}
          conversationId={started.conversation.id}
          initialMessages={started.messages}
          initialMemories={started.memories}
          initialValuationCopy={
            initialValuation?.ok ? initialValuation.copy : null
          }
        />
      </main>
    </WorkspaceChrome>
  );
}
