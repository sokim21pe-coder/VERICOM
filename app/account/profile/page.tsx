import Link from "next/link";
import { ProfileForm } from "@/components/account/ProfileForm";
import { getCurrentContext } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loadMyProfile } from "@/lib/account/profile-read";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const context = isSupabaseConfigured() ? await getCurrentContext() : null;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
      <p className="text-[11px] tracking-[0.18em] text-navy">ACCOUNT</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        내 프로필
      </h1>

      {context ? (
        <>
          <p className="mt-3 text-sm leading-6 text-muted">
            기본 정보를 확인하고 수정할 수 있습니다. 이메일과 회원 유형은 읽기
            전용입니다.
          </p>
          <section className="mt-6 rounded-xl border border-line bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">기본 정보</h2>
            <ProfileForm profile={await loadMyProfile(context)} />
          </section>
        </>
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted">
          로그인 후 프로필을 확인할 수 있습니다.{" "}
          <Link href="/login" className="text-navy underline">
            로그인
          </Link>
        </p>
      )}
    </main>
  );
}
