import assert from "node:assert/strict";
import test from "node:test";
import { isPlatformSuperAdmin } from "@/lib/admin/access";
import { adminHeaderIdentity } from "@/lib/admin/header";
import { ADMIN_NAV, liveAdminHrefs } from "@/lib/admin/nav";
import { resolveActivePlatformRole } from "@/lib/auth/active-role";
import { workspaceSwitcherLinks } from "@/lib/auth/workspace-router";
import { PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";

function ctx(roles: PlatformRole[]): CurrentContext {
  return {
    user: {
      id: "u1",
      authUserId: "a1",
      email: "admin@vericom.kr",
      displayName: "Admin",
    },
    company: null,
    platformRole: roles[0] ?? null,
    platformRoles: roles,
    companyMembership: null,
    deal: null,
    dealRole: null,
    permissions: [],
  };
}

test("admin header uses context values, never email-based admin", () => {
  const header = adminHeaderIdentity({
    displayName: "admin",
    email: "admin@vericom.kr",
    platformRole: PlatformRole.PLATFORM_SUPER_ADMIN,
  });
  assert.equal(header.name, "admin");
  assert.equal(header.email, "admin@vericom.kr");
  assert.equal(header.roleLabel, PlatformRole.PLATFORM_SUPER_ADMIN);
  assert.equal(
    isPlatformSuperAdmin([PlatformRole.SELLER_USER]),
    false,
  );
});

test("isPlatformSuperAdmin is role-based, not email-based", () => {
  assert.equal(isPlatformSuperAdmin([PlatformRole.SELLER_USER]), false);
  assert.equal(isPlatformSuperAdmin([PlatformRole.ADMIN]), false);
  assert.equal(isPlatformSuperAdmin([PlatformRole.PLATFORM_SUPER_ADMIN]), true);
});

test("active role cookie still wins over super admin default", () => {
  assert.equal(
    resolveActivePlatformRole(PlatformRole.SELLER_USER, [
      PlatformRole.SELLER_USER,
      PlatformRole.PLATFORM_SUPER_ADMIN,
    ]),
    PlatformRole.SELLER_USER,
  );
});

test("no cookie prefers PLATFORM_SUPER_ADMIN when owned", () => {
  assert.equal(
    resolveActivePlatformRole(null, [
      PlatformRole.SELLER_USER,
      PlatformRole.PLATFORM_SUPER_ADMIN,
    ]),
    PlatformRole.PLATFORM_SUPER_ADMIN,
  );
});

test("spoofed super admin cookie is ignored", () => {
  assert.equal(
    resolveActivePlatformRole(PlatformRole.PLATFORM_SUPER_ADMIN, [
      PlatformRole.SELLER_USER,
    ]),
    PlatformRole.SELLER_USER,
  );
});

test("control tower live admin items stay out of coming-soon routes", () => {
  const soon = ADMIN_NAV.flatMap((group) => group.items)
    .filter((item) => item.comingSoon)
    .map((item) => item.label);
  assert.deepEqual(liveAdminHrefs(), [
    "/admin/dashboard",
    "/admin/users",
    "/admin/companies",
    "/admin/deals",
    "/admin/tom",
    "/admin/documents",
    "/admin/valuations",
    "/admin/audit-logs",
  ]);
  assert.ok(soon.includes("Roles & Permissions"));
  assert.ok(soon.includes("Deal Pipeline"));
  assert.ok(soon.includes("Investors / FI"));
  assert.ok(soon.includes("Workflows"));
  assert.ok(soon.includes("Settings"));
  assert.ok(soon.includes("VDR"));
  assert.ok(!soon.includes("Documents"));
  assert.ok(!soon.includes("AI Overview"));
});

test("switcher includes admin only when role is owned", () => {
  const links = workspaceSwitcherLinks(
    ctx([PlatformRole.SELLER_USER, PlatformRole.PLATFORM_SUPER_ADMIN]),
  );
  assert.ok(links.some((item) => item.href === "/admin/dashboard"));
  const sellerOnly = workspaceSwitcherLinks(ctx([PlatformRole.SELLER_USER]));
  assert.ok(!sellerOnly.some((item) => item.href.startsWith("/admin")));
});
