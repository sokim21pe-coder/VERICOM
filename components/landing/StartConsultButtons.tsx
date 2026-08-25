"use client";

import Link from "next/link";
import { startOnboardingHref, type TomIntent } from "@/lib/tom/paths";

const buttonClass = {
  primary:
    "inline-flex h-11 items-center justify-center rounded-md bg-navy px-6 text-sm font-medium text-white hover:bg-navy-hover",
  secondary:
    "inline-flex h-11 items-center justify-center rounded-md border border-line bg-white px-6 text-sm font-medium text-foreground hover:border-navy",
};

export function StartConsultButtons({
  signedIn,
  layout = "row",
}: {
  signedIn: boolean;
  layout?: "row" | "stack";
}) {
  const items: { intent: TomIntent; label: string; variant: "primary" | "secondary" }[] =
    [
      { intent: "sell", label: "기업 매각 시작", variant: "primary" },
      { intent: "buy", label: "기업 인수 시작", variant: "secondary" },
    ];

  return (
    <div
      className={
        layout === "stack"
          ? "mt-8 flex flex-col gap-2.5"
          : "mt-8 flex flex-col gap-2.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-3"
      }
    >
      {items.map((item) => (
        <Link
          key={item.intent}
          href={startOnboardingHref(item.intent, signedIn)}
          className={buttonClass[item.variant]}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
