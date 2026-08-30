import { PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";

export function workspacePathForRole(role: PlatformRole | null): string {
  if (role === PlatformRole.SELLER_USER) return "/seller";
  if (role === PlatformRole.BUYER_USER) return "/buyer";
  if (role === PlatformRole.EXPERT_USER) return "/expert";
  if (
    role === PlatformRole.INTERNAL_DEAL_MANAGER ||
    role === PlatformRole.ADMIN
  ) {
    return "/internal";
  }
  return "/onboarding/purpose";
}

export function needsCompany(role: PlatformRole | null): boolean {
  return (
    role === PlatformRole.SELLER_USER || role === PlatformRole.BUYER_USER
  );
}

export function resolvePostAuthPath(context: CurrentContext | null): string {
  if (!context) return "/login";
  if (context.platformRoles.length === 0) return "/onboarding/purpose";
  const needsCompanyLink = context.platformRoles.some((role) =>
    needsCompany(role),
  );
  if (needsCompanyLink && !context.company) {
    return "/onboarding/company";
  }
  return workspacePathForRole(context.platformRole);
}

export type WorkspaceKind = "seller" | "buyer" | "expert" | "internal";

export function userCanAccessWorkspace(
  workspace: WorkspaceKind,
  roles: PlatformRole[],
): boolean {
  if (workspace === "seller") return roles.includes(PlatformRole.SELLER_USER);
  if (workspace === "buyer") return roles.includes(PlatformRole.BUYER_USER);
  if (workspace === "expert") return roles.includes(PlatformRole.EXPERT_USER);
  return (
    roles.includes(PlatformRole.INTERNAL_DEAL_MANAGER) ||
    roles.includes(PlatformRole.ADMIN)
  );
}

export function workspaceSwitcherLinks(context: CurrentContext) {
  const links: { href: string; label: string }[] = [];
  if (context.platformRoles.includes(PlatformRole.SELLER_USER)) {
    links.push({ href: "/seller", label: "Seller" });
  }
  if (context.platformRoles.includes(PlatformRole.BUYER_USER)) {
    links.push({ href: "/buyer", label: "Buyer" });
  }
  if (context.platformRoles.includes(PlatformRole.EXPERT_USER)) {
    links.push({ href: "/expert", label: "전문가" });
  }
  if (
    context.platformRoles.includes(PlatformRole.INTERNAL_DEAL_MANAGER) ||
    context.platformRoles.includes(PlatformRole.ADMIN)
  ) {
    links.push({ href: "/internal", label: "Internal" });
  }
  return links;
}
