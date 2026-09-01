import assert from "node:assert/strict";
import test from "node:test";
import { buyerNav, expertNav, internalNav, sellerNav } from "@/lib/workspace/nav";

test("seller nav only lists wired or honest preparing items", () => {
  assert.deepEqual(
    sellerNav.map((item) => item.label),
    ["홈", "TOM(AI)", "거래", "자료실", "가치평가", "문서"],
  );
  assert.ok(!sellerNav.some((item) => item.href.includes("/mm")));
  assert.ok(!sellerNav.some((item) => item.label === "인수후보"));
  assert.equal(sellerNav.find((item) => item.label === "문서")?.preparing, true);
  assert.equal(sellerNav.find((item) => item.label === "자료실")?.href, "/seller/docs");
  assert.equal(sellerNav.find((item) => item.label === "가치평가")?.href, "/seller/valuation");
});

test("buyer nav only lists wired or honest preparing items", () => {
  assert.deepEqual(
    buyerNav.map((item) => item.label),
    ["홈", "TOM(AI)", "인수조건", "거래", "문서"],
  );
  assert.ok(!buyerNav.some((item) => item.href.includes("/mm")));
  assert.ok(!buyerNav.some((item) => item.label === "추천 Deal"));
  assert.equal(buyerNav.find((item) => item.label === "인수조건")?.href, "/buyer/criteria");
  assert.equal(buyerNav.find((item) => item.label === "문서")?.href, "/buyer/docs");
});

test("expert nav wires 비교배수 and keeps preparing items honest", () => {
  assert.equal(expertNav.find((item) => item.label === "비교배수")?.href, "/expert/benchmarks");
  assert.equal(expertNav.find((item) => item.label === "배정 Deal")?.preparing, true);
  assert.ok(!expertNav.some((item) => item.label === "비교배수" && item.preparing));
});

test("internal nav wires 비교배수", () => {
  assert.equal(internalNav.find((item) => item.label === "비교배수")?.href, "/internal/benchmarks");
  assert.deepEqual(
    internalNav.map((item) => item.label),
    ["홈", "비교배수"],
  );
});
