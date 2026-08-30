"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setActiveDeal } from "@/lib/auth/actions";
import { dealRoleShortLabel } from "@/lib/auth/active-deal";
import type { AccessibleDeal } from "@/types/context";

export function ActiveDealSwitcher({
  deals,
  currentDealId,
}: {
  deals: AccessibleDeal[];
  currentDealId: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  if (deals.length === 0) return null;

  async function onChange(value: string) {
    setPending(true);
    const result = await setActiveDeal(value === "" ? null : value);
    setPending(false);
    if (result.ok) {
      router.refresh();
    }
  }

  return (
    <label className="flex items-center gap-2 text-xs text-muted">
      <span className="sr-only">거래 선택</span>
      <select
        disabled={pending}
        value={currentDealId ?? ""}
        onChange={(event) => void onChange(event.target.value)}
        className="max-w-[14rem] rounded-md border border-line bg-white px-2 py-1 text-xs text-foreground"
      >
        <option value="">거래 미선택</option>
        {deals.map((item) => (
          <option key={item.id} value={item.id}>
            {(item.title ?? "Deal").slice(0, 40)} ({dealRoleShortLabel(item.dealRole)})
          </option>
        ))}
      </select>
    </label>
  );
}
