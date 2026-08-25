"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectPlatformRole } from "@/lib/auth/actions";
import { PlatformRole } from "@/types/enums";

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

export function PurposeForm({ existingRoles }: { existingRoles: PlatformRole[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<PlatformRole | null>(null);

  async function onSelect(role: PlatformRole) {
    setMessage(null);
    setPending(role);
    const result = await selectPlatformRole(role);
    setPending(null);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    router.push(result.redirectTo ?? "/onboarding/purpose");
    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-3">
      {options.map((option) => {
        const added = existingRoles.includes(option.role);
        return (
          <button
            key={option.role}
            type="button"
            disabled={pending !== null}
            onClick={() => onSelect(option.role)}
            className="rounded-md border border-line bg-white px-4 py-4 text-left hover:border-navy disabled:opacity-60"
          >
            <p className="text-sm font-medium text-foreground">
              {option.title}
              {added ? (
                <span className="ml-2 text-xs font-normal text-muted">
                  이미 선택함
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {option.description}
            </p>
            {pending === option.role ? (
              <p className="mt-2 text-xs text-muted">저장 중…</p>
            ) : null}
          </button>
        );
      })}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <p className="text-xs leading-5 text-muted">
        지금은 선택한 이용목적만 저장합니다. 나중에 역할을 더 추가할 수
        있습니다.
      </p>
    </div>
  );
}
