import { PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";
import type { TomIntent } from "@/lib/tom/paths";
import { parseTomIntent } from "@/lib/tom/paths";

export function consultWorkspace(intent: TomIntent): "seller" | "buyer" {
  return intent === "buy" ? "buyer" : "seller";
}

export function resolveConsultIntent(
  context: CurrentContext,
  rawIntent: string | undefined,
): TomIntent | null {
  const requested = parseTomIntent(rawIntent);
  const hasSeller = context.platformRoles.includes(PlatformRole.SELLER_USER);
  const hasBuyer = context.platformRoles.includes(PlatformRole.BUYER_USER);

  if (requested === "sell" && hasSeller) return "sell";
  if (requested === "buy" && hasBuyer) return "buy";

  if (context.platformRole === PlatformRole.SELLER_USER && hasSeller) {
    return "sell";
  }
  if (context.platformRole === PlatformRole.BUYER_USER && hasBuyer) {
    return "buy";
  }
  if (hasSeller) return "sell";
  if (hasBuyer) return "buy";
  return null;
}
