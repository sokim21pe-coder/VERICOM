import assert from "node:assert/strict";
import test from "node:test";
import { mergeRoutedIntent } from "@/lib/tom/intent-router";
import { InformationState } from "@/types/enums";
import type { RoutedIntent } from "@/lib/tom/intent-router";

function item(
  intent: RoutedIntent["intent"],
  confidence: number,
  state: InformationState,
): RoutedIntent {
  return {
    intent,
    value: intent,
    source: "rule",
    confidence,
    match: confidence >= 1 ? "exact" : confidence > 0 ? "rule" : "none",
    informationState: state,
  };
}

test("first intent is stored", () => {
  const incoming = item("SELL", 1, InformationState.CONFIRMED);
  const result = mergeRoutedIntent(null, incoming);
  assert.equal(result.changed, true);
  assert.equal(result.next.intent, "SELL");
});

test("same SELL does not insert a second logical row", () => {
  const existing = item("SELL", 1, InformationState.CONFIRMED);
  const incoming = item("SELL", 1, InformationState.CONFIRMED);
  const result = mergeRoutedIntent(existing, incoming);
  assert.equal(result.changed, false);
  assert.equal(result.next.intent, "SELL");
});

test("UNKNOWN does not overwrite stored SELL", () => {
  const existing = item("SELL", 0.8, InformationState.CONFIRMED);
  const incoming = item("UNKNOWN", 0, InformationState.UNKNOWN);
  const result = mergeRoutedIntent(existing, incoming);
  assert.equal(result.changed, false);
  assert.equal(result.next.intent, "SELL");
});
