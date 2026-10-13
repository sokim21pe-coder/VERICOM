"use client";

import Link from "next/link";
import { startOnboardingHref, type TomIntent } from "@/lib/tom/paths";

const buttonClass = {
  primary:
    "inline-flex h-12 items-center justify-center rounded-md bg-navy px-7 text-sm font-semibold text-white transition-colors hover:bg-navy-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
  secondary:
    "inline-flex h-12 items-center justify-center rounded-md border border-[#E4E7EC] bg-white px-7 text-sm font-medium text-[#101828] transition-colors hover:border-navy hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
  inversePrimary:
    "inline-flex h-12 items-center justify-center rounded-md bg-white px-7 text-sm font-semibold text-navy transition-colors hover:bg-[#F7F8FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
  inverseSecondary:
    "inline-flex h-12 items-center justify-center rounded-md border border-white/30 px-7 text-sm font-medium text-white transition-colors hover:border-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
};

export function StartConsultButtons({
  signedIn,
  layout = "row",
  tone = "default",
}: {
  signedIn: boolean;
  layout?: "row" | "stack";
  tone?: "default" | "onNavy";
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
          className={
            tone === "onNavy"
              ? buttonClass[item.variant === "primary" ? "inversePrimary" : "inverseSecondary"]
              : buttonClass[item.variant]
          }
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
