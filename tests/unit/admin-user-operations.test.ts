import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCOUNT_DISABLED_MESSAGE,
  ACCOUNT_DISABLED_PATH,
  SUPER_ADMIN_CONFIRM_TEXT,
  adminStaffStillInternalOnly,
  evaluateAddPlatformRole,
  evaluateDisableUser,
  evaluateEnableUser,
  evaluateRemovePlatformRole,
  isAccountDisabled,
  isDisabledBlockedPath,
  isSensitivePlatformRole,
  mapAdminRpcError,
} from "@/lib/admin/operations";
import { userCanAccessWorkspace, workspacePathForRole } from "@/lib/auth/workspace-router";
import { PlatformRole } from "@/types/enums";

const catalog = [
  "SELLER_USER",
  "BUYER_USER",
  "EXPERT_USER",
  "INTERNAL_DEAL_MANAGER",
  "ADMIN",
  "PLATFORM_SUPER_ADMIN",
];

test("A: disable active user is allowed when not last super admin", () => {
  const result = evaluateDisableUser({
    actorUserId: "admin-1",
    targetUserId: "seller-1",
    targetStatus: "active",
    targetRoles: ["SELLER_USER"],
    activeSuperAdminCount: 1,
  });
  assert.deepEqual(result, { ok: true });
});

test("B: enable disabled user is allowed", () => {
  assert.deepEqual(evaluateEnableUser({ targetStatus: "disabled" }), { ok: true });
});

test("C: super admin cannot disable self", () => {
  const result = evaluateDisableUser({
    actorUserId: "admin-1",
    targetUserId: "admin-1",
    targetStatus: "active",
    targetRoles: ["PLATFORM_SUPER_ADMIN"],
    activeSuperAdminCount: 2,
  });
  assert.deepEqual(result, { ok: false, code: "ADMIN_SELF_DISABLE" });
});

test("D: last active super admin cannot be disabled", () => {
  const result = evaluateDisableUser({
    actorUserId: "admin-2",
    targetUserId: "admin-1",
    targetStatus: "active",
    targetRoles: ["PLATFORM_SUPER_ADMIN"],
    activeSuperAdminCount: 1,
  });
  assert.deepEqual(result, { ok: false, code: "ADMIN_LAST_SUPER_ADMIN" });
});

test("E: seller can receive BUYER_USER", () => {
  const result = evaluateAddPlatformRole({
    role: "BUYER_USER",
    existingRoles: ["SELLER_USER"],
    catalog,
  });
  assert.deepEqual(result, { ok: true });
});

test("F: existing role can be removed", () => {
  const result = evaluateRemovePlatformRole({
    actorUserId: "admin-1",
    targetUserId: "seller-1",
    role: "SELLER_USER",
    existingRoles: ["SELLER_USER", "BUYER_USER"],
    catalog,
    targetStatus: "active",
    activeSuperAdminCount: 1,
  });
  assert.deepEqual(result, { ok: true });
});

test("G: PLATFORM_SUPER_ADMIN add requires confirm phrase", () => {
  assert.deepEqual(
    evaluateAddPlatformRole({
      role: "PLATFORM_SUPER_ADMIN",
      existingRoles: ["SELLER_USER"],
      catalog,
      confirm: "",
    }),
    { ok: false, code: "ADMIN_CONFIRM_REQUIRED" },
  );
  assert.deepEqual(
    evaluateAddPlatformRole({
      role: "PLATFORM_SUPER_ADMIN",
      existingRoles: ["SELLER_USER"],
      catalog,
      confirm: SUPER_ADMIN_CONFIRM_TEXT,
    }),
    { ok: true },
  );
});

test("H: last super admin role cannot be removed", () => {
  const result = evaluateRemovePlatformRole({
    actorUserId: "admin-2",
    targetUserId: "admin-1",
    role: "PLATFORM_SUPER_ADMIN",
    existingRoles: ["PLATFORM_SUPER_ADMIN"],
    catalog,
    targetStatus: "active",
    activeSuperAdminCount: 1,
  });
  assert.deepEqual(result, { ok: false, code: "ADMIN_LAST_SUPER_ADMIN" });
});

test("I: self cannot remove own super admin role", () => {
  const result = evaluateRemovePlatformRole({
    actorUserId: "admin-1",
    targetUserId: "admin-1",
    role: "PLATFORM_SUPER_ADMIN",
    existingRoles: ["PLATFORM_SUPER_ADMIN"],
    catalog,
    targetStatus: "active",
    activeSuperAdminCount: 2,
  });
  assert.deepEqual(result, { ok: false, code: "ADMIN_SELF_REMOVE_SUPER" });
});

test("J: staff ADMIN still cannot open /admin", () => {
  assert.equal(userCanAccessWorkspace("admin", [PlatformRole.ADMIN]), false);
  assert.equal(workspacePathForRole(PlatformRole.ADMIN), "/internal");
  assert.equal(adminStaffStillInternalOnly(["ADMIN"]), true);
  assert.equal(
    adminStaffStillInternalOnly(["ADMIN", "PLATFORM_SUPER_ADMIN"]),
    false,
  );
});

test("K/L: mutation errors stay mapped, never raw SQL", () => {
  assert.equal(
    mapAdminRpcError("not permitted: platform super admin required"),
    "이 작업을 수행할 권한이 없습니다.",
  );
  assert.equal(
    mapAdminRpcError("ADMIN_LAST_SUPER_ADMIN"),
    "최소 1명의 활성 최고 관리자가 필요합니다.",
  );
  assert.equal(mapAdminRpcError("ADMIN_ALREADY_HAS_ROLE"), "이미 부여된 권한입니다.");
  assert.equal(mapAdminRpcError("ADMIN_ALREADY_DISABLED"), "현재 사용자는 이미 정지 상태입니다.");
  assert.equal(mapAdminRpcError("permission denied for table users"), "요청을 처리하지 못했습니다.");
});

test("N: unknown role and missing target stay safe", () => {
  assert.deepEqual(
    evaluateAddPlatformRole({
      role: "FAKE_ROLE",
      existingRoles: [],
      catalog,
    }),
    { ok: false, code: "ADMIN_INVALID_ROLE" },
  );
  assert.deepEqual(
    evaluateRemovePlatformRole({
      actorUserId: "a",
      targetUserId: "b",
      role: "SELLER_USER",
      existingRoles: [],
      catalog,
      targetStatus: "active",
      activeSuperAdminCount: 1,
    }),
    { ok: false, code: "ADMIN_ROLE_NOT_FOUND" },
  );
});

test("disabled workspace paths are blocked except notice and login", () => {
  assert.equal(isAccountDisabled("disabled"), true);
  assert.equal(isAccountDisabled("active"), false);
  assert.equal(isDisabledBlockedPath("/seller"), true);
  assert.equal(isDisabledBlockedPath("/buyer"), true);
  assert.equal(isDisabledBlockedPath("/expert"), true);
  assert.equal(isDisabledBlockedPath("/internal"), true);
  assert.equal(isDisabledBlockedPath("/admin/dashboard"), true);
  assert.equal(isDisabledBlockedPath("/account/profile"), true);
  assert.equal(isDisabledBlockedPath("/onboarding/company"), true);
  assert.equal(isDisabledBlockedPath(ACCOUNT_DISABLED_PATH), false);
  assert.equal(isDisabledBlockedPath("/login"), false);
  assert.equal(isDisabledBlockedPath("/"), false);
  assert.ok(ACCOUNT_DISABLED_MESSAGE.includes("사용이 중지"));
});

test("sensitive roles include internal staff and super admin only", () => {
  assert.equal(isSensitivePlatformRole("SELLER_USER"), false);
  assert.equal(isSensitivePlatformRole("INTERNAL_DEAL_MANAGER"), true);
  assert.equal(isSensitivePlatformRole("ADMIN"), true);
  assert.equal(isSensitivePlatformRole("PLATFORM_SUPER_ADMIN"), true);
});

test("already disabled/active status is rejected", () => {
  assert.deepEqual(
    evaluateDisableUser({
      actorUserId: "a",
      targetUserId: "b",
      targetStatus: "disabled",
      targetRoles: ["SELLER_USER"],
      activeSuperAdminCount: 1,
    }),
    { ok: false, code: "ADMIN_ALREADY_DISABLED" },
  );
  assert.deepEqual(evaluateEnableUser({ targetStatus: "active" }), {
    ok: false,
    code: "ADMIN_ALREADY_ACTIVE",
  });
});
