import assert from "node:assert/strict";
import test from "node:test";
import {
  companyStatusLabel,
  companyVerificationLabel,
} from "@/lib/admin/format";
import {
  evaluateCompanyStatusChange,
  evaluateCompanyVerificationChange,
  mapAdminRpcError,
} from "@/lib/admin/operations";
import { userCanAccessWorkspace, workspacePathForRole } from "@/lib/auth/workspace-router";
import { PlatformRole } from "@/types/enums";

test("A/B/C: verification and status labels stay existing schema values", () => {
  assert.equal(companyVerificationLabel("unverified"), "미확인");
  assert.equal(companyVerificationLabel("pending"), "검토 중");
  assert.equal(companyVerificationLabel("verified"), "확인됨");
  assert.equal(companyStatusLabel("draft"), "초안");
  assert.equal(companyStatusLabel("active"), "활성");
  assert.equal(companyStatusLabel("inactive"), "비활성");
});

test("G: verification update allows existing values only", () => {
  assert.deepEqual(
    evaluateCompanyVerificationChange({ current: "unverified", next: "pending" }),
    { ok: true },
  );
  assert.deepEqual(
    evaluateCompanyVerificationChange({ current: "pending", next: "verified" }),
    { ok: true },
  );
  assert.deepEqual(
    evaluateCompanyVerificationChange({ current: "verified", next: "verified" }),
    { ok: false, code: "ADMIN_VERIFICATION_UNCHANGED" },
  );
  assert.deepEqual(
    evaluateCompanyVerificationChange({ current: "unverified", next: "REJECTED" }),
    { ok: false, code: "ADMIN_INVALID_VERIFICATION" },
  );
});

test("company status uses draft/active/inactive only", () => {
  assert.deepEqual(
    evaluateCompanyStatusChange({ current: "active", next: "inactive" }),
    { ok: true },
  );
  assert.deepEqual(
    evaluateCompanyStatusChange({ current: "active", next: "active" }),
    { ok: false, code: "ADMIN_STATUS_UNCHANGED" },
  );
  assert.deepEqual(
    evaluateCompanyStatusChange({ current: "active", next: "suspended" }),
    { ok: false, code: "ADMIN_INVALID_COMPANY_STATUS" },
  );
});

test("H: company RPC errors stay mapped", () => {
  assert.equal(mapAdminRpcError("ADMIN_COMPANY_NOT_FOUND"), "회사를 찾을 수 없습니다.");
  assert.equal(mapAdminRpcError("ADMIN_INVALID_VERIFICATION"), "허용되지 않은 확인 상태입니다.");
  assert.equal(mapAdminRpcError("ADMIN_VERIFICATION_UNCHANGED"), "이미 같은 확인 상태입니다.");
  assert.equal(
    mapAdminRpcError("not permitted: platform super admin required"),
    "이 작업을 수행할 권한이 없습니다.",
  );
});

test("J: staff ADMIN still cannot open /admin", () => {
  assert.equal(userCanAccessWorkspace("admin", [PlatformRole.ADMIN]), false);
  assert.equal(workspacePathForRole(PlatformRole.ADMIN), "/internal");
  assert.equal(userCanAccessWorkspace("admin", [PlatformRole.SELLER_USER]), false);
});

test("K: seller onboarding path is unchanged", () => {
  assert.equal(workspacePathForRole(PlatformRole.SELLER_USER), "/seller");
  assert.equal(workspacePathForRole(PlatformRole.BUYER_USER), "/buyer");
});
