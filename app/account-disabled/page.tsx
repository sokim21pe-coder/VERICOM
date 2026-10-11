import { LogoutButton } from "@/components/auth/LogoutButton";
import { ACCOUNT_DISABLED_MESSAGE } from "@/lib/auth/account-status";

export const dynamic = "force-dynamic";

export default function AccountDisabledPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-16">
      <p className="text-[11px] tracking-[0.18em] text-navy">계정</p>
      <h1 className="mt-2 text-2xl font-semibold">계정이 정지되었습니다</h1>
      <p className="mt-3 text-sm leading-6 text-muted">{ACCOUNT_DISABLED_MESSAGE}</p>
      <div className="mt-8">
        <LogoutButton />
      </div>
    </main>
  );
}
