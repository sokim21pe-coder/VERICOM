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

/** Seller LEVEL 0 EV/Sales 조회. Client userId/companyId/platformRole을 믿지 않는다. */
export function canReadSellerLevel0Valuation(
  conversation: TomConversation,
  context: CurrentContext,
): boolean {
  return canReadNormalizedSellerFinancials(conversation, context);
}

export function canWriteTomConversation(
  ownerUserId: string,
  context: CurrentContext,
): boolean {
  return ownerUserId === context.user.id;
}

const STAFF_BENCHMARK_ROLES: ReadonlySet<PlatformRole> = new Set([
  PlatformRole.EXPERT_USER,
  PlatformRole.INTERNAL_DEAL_MANAGER,
  PlatformRole.ADMIN,
]);

/** Expert/Internal/Admin만 승인 배수를 쓸 수 있다. Client role을 믿지 않는다. */
export function canWriteApprovedValuationBenchmark(
  context: CurrentContext,
): boolean {
  if (!context.user.id) return false;
  if (!context.platformRole) return false;
  return STAFF_BENCHMARK_ROLES.has(context.platformRole);
}

/** Seller는 자기 회사·매각 컨텍스트만 읽는다. Buyer는 타사 배수를 읽지 못한다. */
export function canReadApprovedValuationBenchmark(
  context: CurrentContext,
  sellerCompanyId: string | null,
): boolean {
  if (!sellerCompanyId) return false;
  if (canWriteApprovedValuationBenchmark(context)) return true;
  if (context.platformRole !== PlatformRole.SELLER_USER) return false;
  return context.company?.id === sellerCompanyId;
}
