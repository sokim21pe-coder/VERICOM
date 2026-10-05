import type { CurrentContext } from "@/types/context";
import { PlatformRole } from "@/types/enums";

// Teaser 접근 가드. Client role/companyId를 믿지 않고 서버 CurrentContext로만 판단한다.
// - Seller는 자기 회사 Teaser만 생성/수정/승인/조회.
// - 다른 Seller Company는 접근 불가(cross-company 차단).
// - Buyer는 어떤 Teaser도 접근 불가(승인 전/후 모두).
// - Expert/Internal/Admin(staff)은 현재 Permission 범위에서 조회만 가능하다.

const STAFF_ROLES: ReadonlySet<PlatformRole> = new Set([
  PlatformRole.EXPERT_USER,
  PlatformRole.INTERNAL_DEAL_MANAGER,
  PlatformRole.ADMIN,
]);

function isStaff(context: CurrentContext): boolean {
  return context.platformRole != null && STAFF_ROLES.has(context.platformRole);
}

function isSellerOfCompany(
  context: CurrentContext,
  companyId: string | null,
): boolean {
  if (context.platformRole !== PlatformRole.SELLER_USER) return false;
  if (!context.company?.id || !companyId) return false;
  return context.company.id === companyId;
}

/** 새 Teaser를 만들 수 있는가. Seller + 연결된 회사 필요. */
export function canCreateTeaser(context: CurrentContext): boolean {
  if (!context.user.id) return false;
  if (context.platformRole !== PlatformRole.SELLER_USER) return false;
  return Boolean(context.company?.id);
}

/** Teaser를 조회할 수 있는가. 자기 회사 Seller 또는 staff. Buyer는 불가. */
export function canViewTeaser(
  context: CurrentContext,
  teaserCompanyId: string | null,
): boolean {
  if (!context.user.id) return false;
  if (context.platformRole === PlatformRole.BUYER_USER) return false;
  if (isSellerOfCompany(context, teaserCompanyId)) return true;
  if (isStaff(context)) return true;
  return false;
}

/** Teaser를 수정할 수 있는가. 자기 회사 Seller만. staff/Buyer 불가. */
export function canEditTeaser(
  context: CurrentContext,
  teaserCompanyId: string | null,
): boolean {
  if (!context.user.id) return false;
  return isSellerOfCompany(context, teaserCompanyId);
}

/** Teaser를 승인할 수 있는가. 자기 회사 Seller만. AI/staff 자동 승인 불가. */
export function canApproveTeaser(
  context: CurrentContext,
  teaserCompanyId: string | null,
): boolean {
  return canEditTeaser(context, teaserCompanyId);
}
