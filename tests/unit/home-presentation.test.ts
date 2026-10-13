import assert from "node:assert/strict";
import test from "node:test";
import { SELLER_WORKFLOW_STAGES } from "@/lib/deal/standard-workflow";
import {
  HOME_AVAILABILITY,
  HOME_FINAL_CTA,
  HOME_HERO_CTA,
  HOME_WORKFLOW_PHASES,
  homeSellerPhases,
} from "@/lib/landing/home-presentation";
import { LANDING_BUY_HREF, LANDING_SELL_HREF } from "@/lib/landing/service-pages";

test("homepage CTAs reuse existing start and about routes", () => {
  assert.equal(HOME_HERO_CTA.primary.href, "/start?intent=sell");
  assert.equal(HOME_HERO_CTA.secondary.href, "/about/service");
  assert.equal(HOME_FINAL_CTA.primary.href, "/start?intent=sell");
  assert.equal(HOME_FINAL_CTA.secondary.href, "/login");
});

test("homepage workflow phases keep all 13 seller labels in order", () => {
  const phases = homeSellerPhases();
  const labels = phases.flatMap((phase) => phase.steps.map((step) => step.label));
  assert.equal(labels.length, 13);
  assert.deepEqual(
    labels,
    SELLER_WORKFLOW_STAGES.map((stage) => stage.label),
  );
  assert.equal(
    HOME_WORKFLOW_PHASES.flatMap((phase) => [...phase.orders]).join(","),
    "1,2,3,4,5,6,7,8,9,10,11,12,13",
  );
});

test("sell and buy info routes stay unchanged", () => {
  assert.equal(LANDING_SELL_HREF, "/about/sell");
  assert.equal(LANDING_BUY_HREF, "/about/buy");
});

test("homepage availability labels stay honest", () => {
  assert.equal(HOME_AVAILABILITY.live, "현재 제공");
  assert.equal(HOME_AVAILABILITY.planned, "개발 예정");
  assert.notEqual(HOME_AVAILABILITY.planned, HOME_AVAILABILITY.live);
});
