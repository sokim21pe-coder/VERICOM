import { DealRole } from "@/types/enums";

export const ACTIVE_DEAL_COOKIE = "vericom_active_deal_id";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function asDealId(value: string): string | null {
  const trimmed = value.trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

export function isSellerDealRole(role: DealRole): boolean {
  return (
    role === DealRole.SELLER_OWNER ||
    role === DealRole.SELLER_OPERATOR ||
    role === DealRole.SELLER_ADVISOR
  );
}

export function isBuyerDealRole(role: DealRole): boolean {
  return (
    role === DealRole.BUYER_OWNER ||
    role === DealRole.BUYER_OPERATOR ||
    role === DealRole.BUYER_ADVISOR
  );
}

/**
 * Company에는 영구 Seller/Buyer 속성이 없다.
 * Seller 역할은 해당 Deal의 seller_company_id와 일치할 때만,
 * Buyer 역할은 현재 Company가 seller_company_id가 아닐 때만 허용한다.
 * Expert / Internal은 회사 없이 participant만으로 허용한다.
 */
export function isCompanyAllowedOnDeal(input: {
  companyId: string | null;
  sellerCompanyId: string | null;
  dealRole: DealRole;
}): boolean {
  if (isSellerDealRole(input.dealRole)) {
    return Boolean(
      input.companyId &&
        input.sellerCompanyId &&
        input.companyId === input.sellerCompanyId,
    );
  }
  if (isBuyerDealRole(input.dealRole)) {
    return Boolean(
      input.companyId &&
        input.sellerCompanyId &&
        input.companyId !== input.sellerCompanyId,
    );
  }
  return true;
}

/** 요청 dealId는 서버가 허용한 목록 안에 있을 때만 쓴다. 최신 행을 고르지 않는다. */
export function resolveActiveDealId(
  requestedDealId: string | null,
  allowedDealIds: string[],
): string | null {
  if (requestedDealId && allowedDealIds.includes(requestedDealId)) {
    return requestedDealId;
  }
  return null;
}

/** 클라이언트 companyId는 쓰지 않는다. Membership Company만 Source of Truth. */
export function resolveActiveCompanyId(
  clientCompanyId: string | null,
  membershipCompanyId: string | null,
): string | null {
  void clientCompanyId;
  return membershipCompanyId;
}

export function dealRoleShortLabel(role: DealRole): string {
  if (isSellerDealRole(role)) return "Seller";
  if (isBuyerDealRole(role)) return "Buyer";
  if (role === DealRole.EXPERT) return "전문가";
  if (role === DealRole.INTERNAL_MANAGER) return "Internal";
  return role;
}
