import type { CurrentContext } from "@/types/context";
import type { TomConversation } from "@/types/tom";
import { PlatformRole } from "@/types/enums";

export function canReadTomConversation(
  conversation: TomConversation,
  context: CurrentContext,
): boolean {
  if (conversation.companyId && context.company?.id) {
    return conversation.companyId === context.company.id;
  }
  return Boolean(context.company?.id);
}

/** Buyer Acquisition Criteria 정규화 조회. Client userId/companyId/platformRole을 믿지 않는다. */
export function canReadNormalizedBuyerCriteria(
  conversation: TomConversation,
  context: CurrentContext,
): boolean {
  if (context.platformRole !== PlatformRole.BUYER_USER) return false;
  if (!context.company?.id) return false;
  if (conversation.intent !== "buy") return false;
  if (!conversation.companyId || conversation.companyId !== context.company.id) {
    return false;
  }
  return canReadTomConversation(conversation, context);
}

/** Seller 재무 입력 정규화 조회. Client userId/companyId/platformRole을 믿지 않는다. */
export function canReadNormalizedSellerFinancials(
  conversation: TomConversation,
  context: CurrentContext,
): boolean {
  if (context.platformRole !== PlatformRole.SELLER_USER) return false;
  if (!context.company?.id) return false;
  if (conversation.intent !== "sell") return false;
  if (!conversation.companyId || conversation.companyId !== context.company.id) {
    return false;
  }
  return canReadTomConversation(conversation, context);
}

export function canWriteTomConversation(
  ownerUserId: string,
  context: CurrentContext,
): boolean {
  return ownerUserId === context.user.id;
}
