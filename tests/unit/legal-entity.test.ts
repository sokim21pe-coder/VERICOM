import assert from "node:assert/strict";
import test from "node:test";
import { LEGAL_ENTITY } from "@/lib/brand/legal-entity";

test("public company intro keeps only confirmed registration fields", () => {
  assert.equal(LEGAL_ENTITY.legalName, "주식회사 에프오비인베스트");
  assert.equal(LEGAL_ENTITY.representative, "김순오, 김영준");
  assert.equal(LEGAL_ENTITY.businessRegistrationNumber, "310-86-02821");
  assert.ok(LEGAL_ENTITY.address.includes("목동중앙로 143"));
  assert.equal(LEGAL_ENTITY.contact, "02.4007.1888, 010.9814.1845");
});
