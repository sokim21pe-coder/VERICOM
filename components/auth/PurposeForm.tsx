"use client";

import { useActionState } from "react";
import { submitPurposeRole } from "@/lib/auth/actions";
import { PlatformRole } from "@/types/enums";
import type { ActionResult } from "@/lib/auth/actions";

const options: {
  role: PlatformRole;
  title: string;
  description: string;
}[] = [
  {
    role: PlatformRole.SELLER_USER,
    title: "기업 매각",
    description: "기업을 매각하고 싶습니다. 지분 매각, 투자유치 또는 승계를 포함합니다.",
  },
  {
    role: PlatformRole.BUYER_USER,
    title: "기업 인수",
    description: "기업을 인수하고 싶습니다. 인수할 기업이나 투자기회를 찾습니다.",
  },
  {
    role: PlatformRole.EXPERT_USER,
    title: "M&A 전문가",
    description:
      "M&A 전문가로 참여하고 싶습니다. 회계·법률·세무·산업 등 전문 업무에 참여합니다.",
  },
];

const initialState: ActionResult = { ok: true, message: null };

export function PurposeForm({ existingRoles }: { existingRoles: string[] }) {
  const [state, formAction, pending] = useActionState(
    submitPurposeRole,
    initialState,
  );

  return (
    <div className="mt-8 grid gap-3">
      {options.map((option) => {
        const added = existingRoles.includes(option.role);
        return (
          <form action={formAction} key={option.role}>
            <input type="hidden" name="role" value={option.role} />
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md border border-line bg-white px-4 py-4 text-left hover:border-navy disabled:opacity-60"
            >
              <span className="block text-sm font-medium text-foreground">
                {option.title}
                {added ? (
                  <span className="ml-2 text-xs font-normal text-muted">
                    이미 선택함
                  </span>
                ) : null}
              </span>
              <span className="mt-1 block text-sm leading-6 text-muted">
                {option.description}
              </span>
              {pending ? (
                <span className="mt-2 block text-xs text-muted">저장 중…</span>
              ) : null}
            </button>
          </form>
        );
      })}
      {state?.message ? (
        <p className="text-sm text-muted">{state.message}</p>
      ) : null}
      <p className="text-xs leading-5 text-muted">
        지금은 선택한 이용목적만 저장합니다. 나중에 역할을 더 추가할 수
        있습니다.
      </p>
    </div>
  );
}
