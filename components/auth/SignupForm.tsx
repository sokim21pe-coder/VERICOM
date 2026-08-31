"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getPostAuthRedirect } from "@/lib/auth/actions";
import { assignAfterAuth } from "@/lib/auth/client-continue";
import { authErrorMessage, mapAuthError } from "@/lib/auth/errors";
import { ErrorCode } from "@/types/enums";

const inputClass =
  "rounded-md border border-line bg-white px-3 py-2 text-foreground outline-none focus:border-navy";

export function SignupForm({
  next,
  intent,
}: {
  next: string | null;
  intent: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("displayName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    if (!displayName) {
      setMessage("이름을 입력해 주세요.");
      return;
    }
    if (!email.includes("@")) {
      setMessage("이메일 형식을 확인해 주세요.");
      return;
    }
    if (password.length < 8) {
      setMessage("비밀번호를 확인해 주세요.");
      return;
    }
    if (password !== confirm) {
      setMessage("비밀번호를 확인해 주세요.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setMessage(authErrorMessage[ErrorCode.ENV_NOT_CONFIGURED]);
      return;
    }

    setPending(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });

    if (error) {
      setPending(false);
      setMessage(mapAuthError(error.message));
      return;
    }

    if (!data.session) {
      setPending(false);
      setMessage(
        "가입이 접수되었습니다. 이메일 확인이 켜져 있으면 메일함에서 인증 후 로그인해 주세요.",
      );
      return;
    }

    const result = await getPostAuthRedirect({ next, intent });
    assignAfterAuth(result.redirectTo, next, intent);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 grid gap-4">
      <label className="grid gap-2 text-sm">
        <span>이름</span>
        <input
          required
          name="displayName"
          autoComplete="name"
          className={inputClass}
        />
      </label>
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
          autoComplete="new-password"
          minLength={8}
          className={inputClass}
        />
      </label>
      <label className="grid gap-2 text-sm">
        <span>비밀번호 확인</span>
        <input
          required
          type="password"
          name="confirm"
          autoComplete="new-password"
          minLength={8}
          className={inputClass}
        />
      </label>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-hover disabled:opacity-60"
      >
        {pending ? "처리 중…" : "회원가입"}
      </button>
    </form>
  );
}
