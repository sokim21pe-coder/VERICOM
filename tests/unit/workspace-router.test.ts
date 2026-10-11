import assert from "node:assert/strict";
import test from "node:test";
import { resolveActivePlatformRole } from "@/lib/auth/active-role";
import {
  resolvePostAuthPath,
  userCanAccessWorkspace,
  workspacePathForRole,
  workspaceSwitcherLinks,
} from "@/lib/auth/workspace-router";
import { PlatformRole } from "@/types/enums";
import type { CurrentContext } from "@/types/context";
import { hasDealPermission } from "@/lib/permissions";

function context(
  roles: PlatformRole[],
  extras?: Partial<CurrentContext>,
): CurrentContext {
  return {
    user: {
      id: "u1",
      authUserId: "a1",
      email: "test.seller.sprint0@vericom.test",
      displayName: "TEST_DEV_SELLER",
    },
    company:
      extras && "company" in extras
        ? extras.company ?? null
        : {
            id: "c1",
            name: "TEST_DEV_SELLER_CO",
            industry: null,
            verificationStatus: "unverified",
          },
    platformRole: extras?.platformRole ?? roles[0] ?? null,
    platformRoles: roles,
    companyMembership: extras?.companyMembership ?? null,
    deal: extras?.deal ?? null,
    dealRole: extras?.dealRole ?? null,
    permissions: extras?.permissions ?? [],
  };
}

test("workspace paths match platform roles", () => {
  assert.equal(workspacePathForRole(PlatformRole.SELLER_USER), "/seller");
  assert.equal(workspacePathForRole(PlatformRole.BUYER_USER), "/buyer");
  assert.equal(workspacePathForRole(PlatformRole.EXPERT_USER), "/expert");
  assert.equal(
    workspacePathForRole(PlatformRole.INTERNAL_DEAL_MANAGER),
    "/internal",
  );
  assert.equal(
    workspacePathForRole(PlatformRole.PLATFORM_SUPER_ADMIN),
    "/admin/dashboard",
  );
  assert.equal(workspacePathForRole(PlatformRole.ADMIN), "/internal");
});

test("cookie role spoof is ignored", () => {
  assert.equal(
    resolveActivePlatformRole(PlatformRole.INTERNAL_DEAL_MANAGER, [
      PlatformRole.SELLER_USER,
    ]),
    PlatformRole.SELLER_USER,
  );
  assert.equal(
    resolveActivePlatformRole(PlatformRole.BUYER_USER, [
      PlatformRole.SELLER_USER,
      PlatformRole.BUYER_USER,
    ]),
    PlatformRole.BUYER_USER,
  );
});

test("seller cannot open buyer or internal workspace", () => {
  const seller = [PlatformRole.SELLER_USER];
  assert.equal(userCanAccessWorkspace("seller", seller), true);
  assert.equal(userCanAccessWorkspace("buyer", seller), false);
  assert.equal(userCanAccessWorkspace("expert", seller), false);
  assert.equal(userCanAccessWorkspace("internal", seller), false);
});

test("internal-only user can open internal only", () => {
  const internal = [PlatformRole.INTERNAL_DEAL_MANAGER];
  assert.equal(userCanAccessWorkspace("internal", internal), true);
  assert.equal(userCanAccessWorkspace("seller", internal), false);
});

test("multi-role switcher shows only owned roles", () => {
  const links = workspaceSwitcherLinks(
    context([PlatformRole.SELLER_USER, PlatformRole.BUYER_USER]),
  );
  assert.deepEqual(
    links.map((item) => item.href),
    ["/seller", "/buyer"],
  );
});

test("missing deal stays null and permission is empty", () => {
  const ctx = context([PlatformRole.BUYER_USER], {
    deal: null,
    dealRole: null,
    permissions: [],
  });
  assert.equal(ctx.deal, null);
  assert.equal(hasDealPermission(ctx, "VIEW_DEAL"), false);
});

test("buyer without company is sent to company onboarding", () => {
  const path = resolvePostAuthPath(
    context([PlatformRole.BUYER_USER], {
      company: null,
      platformRole: PlatformRole.BUYER_USER,
    }),
  );
  assert.equal(path, "/onboarding/company");
});

test("internal without company goes to internal workspace", () => {
  const path = resolvePostAuthPath(
    context([PlatformRole.INTERNAL_DEAL_MANAGER], {
      company: null,
      platformRole: PlatformRole.INTERNAL_DEAL_MANAGER,
    }),
  );
  assert.equal(path, "/internal");
});

test("super admin without company goes to admin dashboard", () => {
  const path = resolvePostAuthPath(
    context([PlatformRole.PLATFORM_SUPER_ADMIN], {
      company: null,
      platformRole: PlatformRole.PLATFORM_SUPER_ADMIN,
    }),
  );
  assert.equal(path, "/admin/dashboard");
});

test("seller cannot open admin workspace", () => {
  assert.equal(userCanAccessWorkspace("admin", [PlatformRole.SELLER_USER]), false);
  assert.equal(userCanAccessWorkspace("admin", [PlatformRole.ADMIN]), false);
  assert.equal(
    userCanAccessWorkspace("admin", [PlatformRole.PLATFORM_SUPER_ADMIN]),
    true,
  );
});

test("existing ADMIN still opens internal, not admin", () => {
  assert.equal(userCanAccessWorkspace("internal", [PlatformRole.ADMIN]), true);
  assert.equal(workspacePathForRole(PlatformRole.ADMIN), "/internal");
});
