import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeRoutedIntent,
  routeIntent,
  shouldReplaceIntent,
} from "@/lib/tom/intent-router";
import { InformationState } from "@/types/enums";

test("SELL exact phrase", () => {
  const a = routeIntent("회사를 매각하고 싶습니다.");
  assert.equal(a.intent, "SELL");
  assert.equal(a.match, "exact");
  assert.equal(a.confidence, 1);
  assert.equal(a.source, "rule");

  const b = routeIntent("기업을 팔고 싶다");
  assert.equal(b.intent, "SELL");
  assert.equal(b.confidence, 1);
});

test("SELL rule match for acquirer search", () => {
  const routed = routeIntent("좋은 인수자를 찾고 있습니다");
  assert.equal(routed.intent, "SELL");
  assert.equal(routed.match, "rule");
  assert.equal(routed.confidence, 0.8);
});

test("BUY exact and valuation are distinct from SELL", () => {
  const buy = routeIntent("기업을 인수하고 싶습니다.");
  assert.equal(buy.intent, "BUY");
  assert.equal(buy.confidence, 1);

  const valuation = routeIntent("내 회사 가치가 궁금하다");
  assert.equal(valuation.intent, "VALUATION");
  assert.equal(valuation.informationState, InformationState.ESTIMATED);
});

test("DOCUMENT teaser phrase", () => {
  const routed = routeIntent("티저를 만들고 싶다");
  assert.equal(routed.intent, "DOCUMENT");
});

test("UNKNOWN empty and unrelated", () => {
  assert.equal(routeIntent("").intent, "UNKNOWN");
  assert.equal(routeIntent("   ").confidence, 0);
  assert.equal(routeIntent("오늘 날씨가 좋습니다").intent, "UNKNOWN");
});

test("does not duplicate weaker UNKNOWN over SELL", () => {
  const sell = routeIntent("회사를 매각하고 싶습니다");
  const unknown = routeIntent("날씨가 좋습니다");
  assert.equal(shouldReplaceIntent(sell, unknown), false);
  const merged = mergeRoutedIntent(sell, unknown);
  assert.equal(merged.changed, false);
  assert.equal(merged.next.intent, "SELL");
});

test("same intent updates when confidence is equal or higher", () => {
  const rule = routeIntent("매각하고 검토 중입니다");
  const exact = routeIntent("회사를 매각하고 싶습니다");
  assert.equal(rule.intent, "SELL");
  assert.equal(exact.confidence, 1);
  assert.equal(shouldReplaceIntent(rule, exact), true);
  const same = mergeRoutedIntent(exact, exact);
  assert.equal(same.changed, false);
});
