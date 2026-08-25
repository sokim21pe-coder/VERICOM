"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPostAuthRedirect } from "@/lib/auth/actions";
import { authErrorMessage, mapAuthError } from "@/lib/auth/errors";
import { ErrorCode } from "@/types/enums";

const inputClass =
  "rounded-md border border-line bg-white px-3 py-2 text-foreground outline-none focus:border-navy";

export function LoginForm({
  next,
  intent,
}: {
  next: string | null;
  intent: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage(authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED]);
      return;
    }

    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setPending(false);

    if (error) {
      setMessage(mapAuthError(error.message));
      return;
    }

    const result = await getPostAuthRedirect({ next, intent });
    if (!result.ok || !result.redirectTo) {
      setMessage(result.message ?? "로그인 후 이동하지 못했습니다.");
      return;
    }
    router.push(result.redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-sm">
        <span>이메일</span>
        <input
          required
          type="email"
          name="email"
          autoComplete="email"
          className={inputClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span>비밀번호</span>
        <input
          required
          type="password"
          name="password"
          autoComplete="current-password"
          className={inputClass}
        />
      </label>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-hover disabled:opacity-60"
      >
        {pending ? "확인 중…" : "로그인"}
      </button>
    </form>
  );
}
