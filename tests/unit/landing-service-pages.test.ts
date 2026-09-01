import assert from "node:assert/strict";
import test from "node:test";
import {
  LANDING_BUY_HREF,
  LANDING_EXPERT_HREF,
  LANDING_GUIDE_HREF,
  LANDING_SELL_HREF,
  LANDING_TOM_HREF,
  LANDING_VALUE_CARDS,
  getLandingServicePage,
  serviceAuthHrefs,
} from "@/lib/landing/service-pages";
import { safeNextPath, startFlowHref } from "@/lib/tom/paths";

test("landing value cards link to public about pages", () => {
  assert.deepEqual(
    LANDING_VALUE_CARDS.map((card) => card.href),
    [
      "/about/valuation",
      "/about/matching",
      "/about/confidential",
      "/about/experts",
    ],
  );
  assert.equal(LANDING_SELL_HREF, "/about/sell");
  assert.equal(LANDING_BUY_HREF, "/about/buy");
  assert.equal(LANDING_EXPERT_HREF, "/about/expert");
  assert.equal(LANDING_GUIDE_HREF, "/about/guide");
  assert.equal(LANDING_TOM_HREF, "/about/tom");
});

test("about pages keep login next inside safeNextPath", () => {
  for (const slug of [
    "valuation",
    "matching",
    "confidential",
    "experts",
    "sell",
    "buy",
    "expert",
    "guide",
    "tom",
  ]) {
    const page = getLandingServicePage(slug);
    assert.ok(page, slug);
    assert.equal(safeNextPath(page.loginNext), page.loginNext);
    const auth = serviceAuthHrefs(page);
    assert.ok(auth.login.startsWith("/login"));
    assert.ok(auth.signup.startsWith("/signup"));
    assert.ok(auth.login.includes("next="));
    assert.ok(auth.signup.includes("next="));
  }
});

test("matching page stays honest about Top3 not being live", () => {
  const matching = getLandingServicePage("matching");
  assert.ok(matching);
  const text = [
    matching.lead,
    ...matching.paragraphs,
    ...matching.available,
    ...matching.upcoming,
  ].join(" ");
  assert.ok(text.includes("준비"));
  assert.ok(!text.includes("추천 1"));
  assert.equal(matching.showStartCta, true);
  assert.equal(matching.loginNext, "/buyer");
});

test("sell and buy about pages use consult next without start buttons", () => {
  const sell = getLandingServicePage("sell");
  const buy = getLandingServicePage("buy");
  assert.equal(sell?.showStartCta, false);
  assert.equal(buy?.showStartCta, false);
  assert.equal(sell?.loginNext, "/consult?intent=sell");
  assert.equal(buy?.loginNext, "/consult?intent=buy");
  assert.equal(startFlowHref("sell"), "/start?intent=sell");
  assert.equal(startFlowHref("buy"), "/start?intent=buy");
});

test("expert and guide about pages link login and signup without inventing DD", () => {
  const expert = getLandingServicePage("expert");
  const guide = getLandingServicePage("guide");
  assert.equal(expert?.href, LANDING_EXPERT_HREF);
  assert.equal(guide?.href, LANDING_GUIDE_HREF);
  assert.equal(expert?.showStartCta, false);
  assert.equal(guide?.showStartCta, false);
  assert.equal(expert?.loginNext, "/expert");
  assert.equal(guide?.loginNext, "/onboarding/purpose");
  const expertText = [
    expert?.lead,
    ...(expert?.paragraphs ?? []),
    ...(expert?.upcoming ?? []),
  ].join(" ");
  assert.ok(expertText.includes("준비"));
  assert.ok(!expertText.includes("가짜"));
});

test("tom about page explains consult after account without guest chat", () => {
  const tom = getLandingServicePage("tom");
  assert.ok(tom);
  assert.equal(tom.href, LANDING_TOM_HREF);
  assert.equal(tom.showStartCta, false);
  assert.equal(tom.loginNext, "/onboarding/purpose");
  assert.equal(tom.intent, null);
  const text = [
    tom.lead,
    ...tom.paragraphs,
    ...tom.available,
    ...tom.upcoming,
  ].join(" ");
  assert.ok(text.includes("Guest"));
  assert.ok(text.includes("준비"));
  assert.ok(!text.includes("익명 상담을 시작합니다"));
  const auth = serviceAuthHrefs(tom);
  assert.ok(auth.login.includes("onboarding"));
  assert.ok(auth.signup.includes("onboarding"));
});
