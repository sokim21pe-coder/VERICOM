"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setActivePlatformRole } from "@/lib/auth/actions";
import { PlatformRole } from "@/types/enums";

const labels: { role: PlatformRole; label: string }[] = [
  { role: PlatformRole.SELLER_USER, label: "Seller" },
  { role: PlatformRole.BUYER_USER, label: "Buyer" },
  { role: PlatformRole.EXPERT_USER, label: "전문가" },
  { role: PlatformRole.INTERNAL_DEAL_MANAGER, label: "Internal" },
];

export function WorkspaceSwitcher({
  roles,
  current,
}: {
  roles: PlatformRole[];
  current: PlatformRole | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const available = labels.filter((item) => roles.includes(item.role));
  if (available.length < 2) return null;

  async function onChange(value: string) {
    const role = value as PlatformRole;
    setPending(true);
    const result = await setActivePlatformRole(role);
    setPending(false);
    if (result.ok && result.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    }
  }

  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="sr-only">워크스페이스 전환</span>
      <select
        disabled={pending}
        value={current ?? available[0]?.role}
        onChange={(event) => void onChange(event.target.value)}
        className="rounded-md border border-line bg-white px-2 py-1 text-xs text-foreground"
      >
        {available.map((item) => (
          <option key={item.role} value={item.role}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
}
