import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPrivateObjectPath,
  isCompanyObjectPath,
  sanitizeFileName,
} from "@/lib/storage/private";

const company = "11111111-1111-4111-8111-111111111111";
const objectId = "22222222-2222-4222-8222-222222222222";

test("object path stays under the company prefix", () => {
  const path = buildPrivateObjectPath(company, "가치평가.pdf", objectId);
  assert.equal(path.startsWith(`${company}/`), true);
  assert.equal(isCompanyObjectPath(path, company), true);
  assert.equal(path.includes(".."), false);
});

test("rejects another company prefix", () => {
  const other = "33333333-3333-4333-8333-333333333333";
  const path = buildPrivateObjectPath(company, "a.txt", objectId);
  assert.equal(isCompanyObjectPath(path, other), false);
  assert.equal(isCompanyObjectPath("../secret", company), false);
});

test("sanitizes file names", () => {
  assert.equal(sanitizeFileName("../../x.pdf"), "x.pdf");
  assert.equal(sanitizeFileName("a b.txt"), "a_b.txt");
});
