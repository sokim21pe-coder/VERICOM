import type { DealRole, PlatformRole } from "./enums";
import type { MembershipRole, MembershipStatus } from "./enums";

export type AppUser = {
  id: string;
  authUserId: string;
  email: string;
  displayName: string;
};

export type AppCompany = {
  id: string;
  name: string;
  industry: string | null;
  verificationStatus: string;
};

export type AppMembership = {
  id: string;
  companyId: string;
  role: MembershipRole;
  status: MembershipStatus;
};

export type AppDeal = {
  id: string;
  title: string | null;
};

export type AccessibleDeal = {
  id: string;
  title: string | null;
  dealRole: DealRole;
  sellerCompanyId?: string | null;
};

/** MASTER_SPEC 4절. Deal이 없으면 deal / dealRole은 null. */
export type CurrentContext = {
  user: AppUser;
  company: AppCompany | null;
  platformRole: PlatformRole | null;
  platformRoles: PlatformRole[];
  companyMembership: AppMembership | null;
  deal: AppDeal | null;
  dealRole: DealRole | null;
  permissions: string[];
};
