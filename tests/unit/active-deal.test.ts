import assert from "node:assert/strict";
import test from "node:test";
import {
  asDealId,
  isCompanyAllowedOnDeal,
  resolveActiveCompanyId,
  resolveActiveDealId,
} from "@/lib/auth/active-deal";
import { resolveActivePlatformRole } from "@/lib/auth/active-role";
import { DealRole, PlatformRole } from "@/types/enums";

const dealA = "6ab0a3da-5844-4ba6-9b03-ae3bf973908d";
const dealB = "99fb3b4b-7f57-4cbd-948f-36356da07154";
const dealY = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";
const sellerCo = "cbb434bb-7ef8-4300-88aa-d19ef14b96cf";
const buyerCoA = "d15328d3-c8fd-459d-b3e6-ed9c439927a4";
const buyerCoB = "8847947e-3cf2-451b-9ea9-5f0b9191e475";

test("does not auto-select a deal when none is requested", () => {
  assert.equal(resolveActiveDealId(null, [dealA, dealB]), null);
  assert.equal(resolveActiveDealId("", [dealA]), null);
});

test("ignores a spoofed dealId that the user cannot access", () => {
  assert.equal(resolveActiveDealId(dealA, []), null);
  assert.equal(resolveActiveDealId(dealA, [dealB]), null);
  assert.equal(resolveActiveDealId("not-a-uuid", [dealA]), null);
});

test("accepts only a participating dealId", () => {
  assert.equal(resolveActiveDealId(dealA, [dealA, dealB]), dealA);
  assert.equal(asDealId(dealA), dealA);
  assert.equal(asDealId("deals/" + dealA), null);
});

test("same company can be seller on deal X and buyer on deal Y", () => {
  assert.equal(
    isCompanyAllowedOnDeal({
      companyId: sellerCo,
      sellerCompanyId: sellerCo,
      dealRole: DealRole.SELLER_OWNER,
    }),
    true,
  );
  assert.equal(
    isCompanyAllowedOnDeal({
      companyId: sellerCo,
      sellerCompanyId: buyerCoA,
      dealRole: DealRole.BUYER_OWNER,
    }),
    true,
  );
});

test("company is not permanently seller or buyer", () => {
  assert.equal(
    isCompanyAllowedOnDeal({
      companyId: sellerCo,
      sellerCompanyId: sellerCo,
      dealRole: DealRole.BUYER_OWNER,
    }),
    false,
  );
  assert.equal(
    isCompanyAllowedOnDeal({
      companyId: buyerCoA,
      sellerCompanyId: sellerCo,
      dealRole: DealRole.SELLER_OWNER,
    }),
    false,
  );
});

test("buyer B company cannot take seller deal context", () => {
  assert.equal(
    isCompanyAllowedOnDeal({
      companyId: buyerCoB,
      sellerCompanyId: sellerCo,
      dealRole: DealRole.SELLER_OWNER,
    }),
    false,
  );
  assert.equal(
    isCompanyAllowedOnDeal({
      companyId: buyerCoB,
      sellerCompanyId: sellerCo,
      dealRole: DealRole.BUYER_OWNER,
    }),
    true,
  );
});

test("expert and internal do not need a company on the deal", () => {
  assert.equal(
    isCompanyAllowedOnDeal({
      companyId: null,
      sellerCompanyId: sellerCo,
      dealRole: DealRole.EXPERT,
    }),
    true,
  );
  assert.equal(
    isCompanyAllowedOnDeal({
      companyId: null,
      sellerCompanyId: sellerCo,
      dealRole: DealRole.INTERNAL_MANAGER,
    }),
    true,
  );
});

test("client companyId is ignored in favor of membership company", () => {
  assert.equal(resolveActiveCompanyId(buyerCoB, sellerCo), sellerCo);
  assert.equal(resolveActiveCompanyId(sellerCo, null), null);
});

test("unheld platform roles including INTERNAL are ignored", () => {
  assert.equal(
    resolveActivePlatformRole(PlatformRole.INTERNAL_DEAL_MANAGER, [
      PlatformRole.SELLER_USER,
    ]),
    PlatformRole.SELLER_USER,
  );
  assert.equal(
    resolveActivePlatformRole(PlatformRole.BUYER_USER, [
      PlatformRole.SELLER_USER,
    ]),
    PlatformRole.SELLER_USER,
  );
  assert.equal(
    resolveActivePlatformRole(PlatformRole.EXPERT_USER, [
      PlatformRole.BUYER_USER,
    ]),
    PlatformRole.BUYER_USER,
  );
});

test("unassigned expert deal stays out of allowed ids", () => {
  const expertAllowed = [dealA];
  assert.equal(resolveActiveDealId(dealB, expertAllowed), null);
  assert.equal(resolveActiveDealId(dealY, expertAllowed), null);
});
