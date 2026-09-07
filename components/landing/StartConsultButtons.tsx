"use client";

import Link from "next/link";
import { startOnboardingHref, type TomIntent } from "@/lib/tom/paths";

const buttonClass = {
  primary:
    "inline-flex h-12 items-center justify-center rounded-md bg-navy px-7 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,33,71,0.24)] transition-colors hover:bg-navy-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
  secondary:
    "inline-flex h-12 items-center justify-center rounded-md border border-line bg-white px-7 text-sm font-semibold text-foreground transition-colors hover:border-navy hover:text-navy focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
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
